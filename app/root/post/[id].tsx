import CustomButton from "@/components/CustomButton";
import DropdownMenu from "@/components/DropdownMenu";
import { fetchAPI } from "@/lib/fetch";
import { convertToLocal, formatDateTruncatedMonth } from "@/lib/utils";
import { PostComment, UserNicknamePair } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";

const PostScreen = () => {
  const { user } = useUser();
  const router = useRouter();
  const navigation = useNavigation();
  const {
    id = "",
    clerk_id = "",
    content = "",
    nickname,
    firstname,
    username,
    like_count,
    report_count,
    created_at,
    unread_comments = 0,
  } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [nicknames, setNicknames] = useState<UserNicknamePair[]>([]);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(
    typeof like_count === "string" ? parseInt(like_count) : 0
  );
  const [isLoadingLike, setIsLoadingLike] = useState<boolean>(false);
  const [commentLikes, setCommentLikes] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [commentLikeCounts, setCommentLikeCounts] = useState<{
    [key: string]: number;
  }>({});
  const [isLoadingCommentLike, setIsLoadingCommentLike] =
    useState<boolean>(false);

  const maxCharacters = 6000;
  const displayName = Array.isArray(firstname) ? firstname[0] : firstname;
  const userId = Array.isArray(clerk_id) ? clerk_id[0] : clerk_id;
  const screenHeight = Dimensions.get("screen").height;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPostDeleted, setIsPostDeleted] = useState(false);

  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!id || !user?.id) return;

      try {
        const response = await fetchAPI(
          `/api/posts/updateLikeCount?postId=${id}&userId=${user.id}`,
          { method: "GET" }
        );

        if (response.error) {
          console.error("Error fetching like status:", response.error);
          return;
        }

        setIsLiked(response.data.liked);
        setLikeCount(response.data.likeCount);
      } catch (error) {
        console.error("Failed to fetch like status:", error);
      }
    };

    fetchLikeStatus();
  }, [id, user?.id]);

  // Updated like handler
  const handleLikePress = async () => {
    if (!id || !user?.id || isLoadingLike) return;

    try {
      setIsLoadingLike(true);
      const increment = !isLiked;

      // Optimistically update UI
      setIsLiked(!isLiked);
      setLikeCount((prev) => (increment ? prev + 1 : prev - 1));

      const response = await fetchAPI(`/api/posts/updateLikeCount`, {
        method: "PATCH",
        body: JSON.stringify({
          postId: id,
          userId: user.id,
          increment,
        }),
      });

      if (response.error) {
        // Revert optimistic update if failed
        setIsLiked(isLiked);
        setLikeCount((prev) => (increment ? prev - 1 : prev + 1));
        Alert.alert("Error", "Unable to update like status. Please try again.");
        return;
      }

      // Update with actual server values
      setLikeCount(response.data.likeCount);
      setIsLiked(response.data.liked);
    } catch (error) {
      console.error("Failed to update like status:", error);
      // Revert optimistic update
      setIsLiked(isLiked);
      setLikeCount((prev) => (!isLiked ? prev - 1 : prev + 1));
      Alert.alert(
        "Error",
        "Unable to update like status. Please check your connection."
      );
    } finally {
      setIsLoadingLike(false);
    }
  };

  const handleCommentLike = async (commentId: number) => {
    if (!user || isLoadingCommentLike) return;

    try {
      setIsLoadingCommentLike(true);
      const isCurrentlyLiked = commentLikes[commentId];

      // Optimistic update
      setCommentLikes((prev) => ({ ...prev, [commentId]: !isCurrentlyLiked }));
      setCommentLikeCounts((prev) => ({
        ...prev,
        [commentId]: prev[commentId] + (isCurrentlyLiked ? -1 : 1),
      }));

      const response = await fetchAPI("/api/comments/updateCommentLike", {
        method: "PATCH",
        body: JSON.stringify({
          commentId,
          userId: user.id,
          increment: !isCurrentlyLiked,
        }),
      });

      if (response.error) {
        // Revert optimistic update
        setCommentLikes((prev) => ({ ...prev, [commentId]: isCurrentlyLiked }));
        setCommentLikeCounts((prev) => ({
          ...prev,
          [commentId]: prev[commentId] + (isCurrentlyLiked ? 1 : -1),
        }));
        Alert.alert("Error", "Unable to update like status");
        return;
      }

      // Update with server values
      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: response.data.liked,
      }));
      setCommentLikeCounts((prev) => ({
        ...prev,
        [commentId]: response.data.likeCount,
      }));
    } catch (error) {
      console.error("Failed to update comment like:", error);
      // Revert optimistic update on error
      const isCurrentlyLiked = commentLikes[commentId];
      setCommentLikes((prev) => ({ ...prev, [commentId]: isCurrentlyLiked }));
      setCommentLikeCounts((prev) => ({
        ...prev,
        [commentId]: prev[commentId] + (isCurrentlyLiked ? 1 : -1),
      }));
    } finally {
      setIsLoadingCommentLike(false);
    }
  };

  function findUserNickname(
    userArray: UserNicknamePair[],
    userId: string
  ): number {
    const index = userArray.findIndex((pair) => pair[0] === userId);
    return index;
  }

  const fetchNicknames = async () => {
    try {
      // //console.log("user: ", user!.id);
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`, {
        method: "GET",
      });
      if (response.error) {
        //console.log("Error fetching user data");
        //console.log("response data: ", response.data);
        //console.log("response status: ", response.status);
        // //console.log("response: ", response);
        throw new Error(response.error);
      }
      // //console.log("response: ", response.data[0].nicknames);
      const nicknames = response.data[0].nicknames || [];
      setNicknames(nicknames);
      return;
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };
  useEffect(() => {
    fetchNicknames();
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);

    if (!id || !user?.id) {
      console.error("Missing required parameters:", {
        postId: id,
        userId: user?.id,
      });
      setError("Missing required parameters");
      setLoading(false);
      return;
    }

    try {
      const response = await fetchAPI(
        `/api/comments/getComments?postId=${id}&userId=${user.id}`,
        { method: "GET" }
      );

      if (response.error) {
        console.error("API Error:", response.error);
        throw new Error(response.error);
      }

      if (!Array.isArray(response.data)) {
        console.error("Invalid response format:", response);
        throw new Error("Invalid response format");
      }

      // Initialize like states from the response
      const likeStatuses = {};
      const likeCounts = {};
      response.data.forEach((comment) => {
        likeStatuses[comment.id] = comment.is_liked || false;
        likeCounts[comment.id] = comment.like_count || 0;
      });

      setPostComments(response.data);
      setCommentLikes(likeStatuses);
      setCommentLikeCounts(likeCounts);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      setError("Failed to fetch comments.");
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    // Prevent submission if already submitting
    if (isSubmitting) {
      return;
    }

    const trimmedComment = newComment.trim();

    if (!trimmedComment || !id || !user?.id || !clerk_id) {
      /*console.log("Missing required data:", { 
          content: trimmedComment, 
          postId: id, 
          clerkId: user?.id,
          postClerkId: clerk_id 
        });*/
      Alert.alert("Error", "Unable to submit comment. Missing required data.");
      return;
    }

    try {
      setIsSubmitting(true); // Start submission
      setNewComment(""); // Clear input immediately to prevent double submission

      const response = await fetchAPI(`/api/comments/newComment`, {
        method: "POST",
        body: JSON.stringify({
          content: trimmedComment,
          postId: id,
          clerkId: user.id,
          postClerkId: clerk_id,
        }),
      });

      if (response.error) {
        console.error("API Error:", response.error);
        throw new Error(response.error);
      }

      // Fetch updated comments with like status
      await fetchComments();
    } catch (error) {
      console.error("Failed to submit comment:", error);
      Alert.alert("Error", "Failed to submit comment. Please try again.");
    } finally {
      setIsSubmitting(false); // End submission regardless of success/failure
    }
  };

  const handleDeletePostPress = async () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel" },
      { text: "Delete", onPress: handleDeletePost },
    ]);
  };

  const handleDeletePost = async () => {
    try {
      setIsPostDeleted(true);

      await fetchAPI(`/api/posts/deletePost?id=${id}`, {
        method: "DELETE",
      });

      Alert.alert("Post deleted.");
      router.back();
    } catch (error) {
      setIsPostDeleted(false);
      Alert.alert("Error deleting post");
    }
  };
  const handleDeleteCommentPress = async (id: number) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel" },
        { text: "Delete", onPress: () => handleDeleteComment(id) },
      ]
    );
  };

  const handleDeleteComment = async (id: number) => {
    try {
      await fetchAPI(`/api/comments/deleteComment?id=${id}`, {
        method: "DELETE",
      });

      Alert.alert("Comment deleted.");
      fetchComments();
    } catch (error) {
      Alert.alert("Error", "Failed to delete comment.");
      console.error("Failed to delete comment:", error);
    }
  };

  const handleUserProfile = async (id: string) => {
    router.push({
      pathname: "/root/profile/[id]",
      params: { id },
    });
  };

  const handleChangeText = (text: string) => {
    if (text.length <= maxCharacters) {
      setNewComment(text);
    } else {
      setNewComment(text.substring(0, maxCharacters));
      Alert.alert(
        "Limit Reached",
        `You can only enter up to ${maxCharacters} characters.`
      );
    }
  };

  useEffect(() => {
    fetchComments();
  }, [id]);

  useEffect(() => {
    navigation.addListener("beforeRemove", (e) => {
      if (Number(unread_comments) > 0) {
        handleReadComments();
      }
      //console.log("User goes back from post screen");
    });
  }, []);

  // before returning user to screen, update unread_comments to 0
  // only if the user is viewing their own post
  const handleReadComments = async () => {
    if (clerk_id === user!.id) {
      try {
        const response = await fetchAPI(`/api/posts/updateUnreadComments`, {
          method: "PATCH",
          body: JSON.stringify({
            clerkId: user?.id,
            postId: id,
            postClerkId: clerk_id,
          }),
        });
      } catch (error) {
        console.error("Failed to update unread comments:", error);
      }
    }
  };

  const handleReportPress = () => {
    Linking.openURL("mailto:support@colore.ca")
  };

  const renderComment = ({ item }: { item: PostComment }) => (
    <View
      key={item.id}
      className="p-4 border-b border-gray-200 flex flex-row justify-between"
    >
      <View className="flex-1">
        <TouchableOpacity onPress={() => handleUserProfile(item.user_id)}>
          <Text className="font-JakartaSemiBold">
            {findUserNickname(nicknames, item.user_id) === -1
              ? item.username
                ? `${item.username}`
                : `${item.firstname.charAt(0)}.`
              : nicknames[findUserNickname(nicknames, item.user_id)][1]}
          </Text>
        </TouchableOpacity>

        <Text className="text-sm text-gray-500">
          {formatDateTruncatedMonth(convertToLocal(new Date(item.created_at)))}
        </Text>

        <View className="flex flex-row mr-2">
          <Text className="flex-1 font-Jakarta">{item.content}</Text>
        </View>
      </View>
      <View className="flex flex-col items-center ml-4">
        {item.user_id === user?.id ? (
          <DropdownMenu
            menuItems={[
              {
                label: "Delete",
                onPress: () => handleDeleteCommentPress(item.id),
              },
            ]}
          />
        ) : (
          <DropdownMenu
            menuItems={[{ label: "Report", onPress: handleReportPress }]}
          />
        )}
        <TouchableOpacity
          onPress={() => handleCommentLike(item.id)}
          disabled={isLoadingCommentLike}
          className="mt-2"
        >
          <MaterialCommunityIcons
            name={commentLikes[item.id] ? "heart" : "heart-outline"}
            size={24}
            color={commentLikes[item.id] ? "red" : "black"}
          />
          {/* Show like count to post creator and comment creator*/}
          {
            (clerk_id === user?.id || item.user_id === user?.id) && (
              /*item.user_id === user?.id ?*/
              <Text className="text-xs text-gray-500 text-center">
                {commentLikeCounts[item.id] || 0}
              </Text>
            ) /*: (
              <Text className="ml-1 text-xs text-gray-500 w-6 text-center mr-1">{commentLikeCounts[item.id] || 0}</Text>
            )*/
          }
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <KeyboardAvoidingView behavior={"padding"} style={{ flex: 1 }}>
          <View className="flex flex-row justify-between items-center mt-3 mx-4 pl-2 pb-3 relative">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <AntDesign name="caretleft" size={18} />
            </TouchableOpacity>
            <View className="absolute top-0 right-1">
              {clerk_id === user?.id ? (
                <DropdownMenu
                  menuItems={[{ label: "Delete", onPress: handleDeletePostPress }]}
                />
              ) : (
                <DropdownMenu
                  menuItems={[{ label: "Report", onPress: handleReportPress }]}
                />
              )}
            </View>
          </View>
          <View className="flex flex-row justify-center items-center mx-4 pl-2">
            <View className="flex-1">
              <TouchableOpacity onPress={() => handleUserProfile(userId)}>
                <Text className="font-JakartaSemiBold text-lg">
                  {nickname || username || displayName.charAt(0) + "."}
                </Text>
              </TouchableOpacity>
              <Text className="text-sm text-gray-500">
                {typeof created_at === "string"
                  ? formatDateTruncatedMonth(
                      convertToLocal(new Date(created_at))
                    )
                  : "No date"}
              </Text>
            </View>
            <View className="flex flex-col items-center">
              {clerk_id === user?.id && (
                <DropdownMenu
                  menuItems={[
                    { label: "Delete", onPress: handleDeletePostPress },
                  ]}
                />
              )}
              <View className="flex items-center">
                <TouchableOpacity
                  onPress={handleLikePress}
                  disabled={isLoadingLike}
                >
                  <MaterialCommunityIcons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={32}
                    color={isLiked ? "red" : "black"}
                  />
                </TouchableOpacity>
                {/* Only show like count to post creator */}
                <Text
                  className={`${clerk_id === user?.id ? "text-gray-600" : "text-transparent"} text-center`}
                >
                  {clerk_id === user?.id ? likeCount : "0"}
                </Text>
              </View>
            </View>
          </View>
          <ScrollView>
            <TouchableWithoutFeedback
              onPress={() => Keyboard.dismiss()}
              onPressIn={() => Keyboard.dismiss()}
            >
              <View className="px-4 border-b border-gray-200 flex flex-row justify-between">
                <View className="flex-1">
                  <Text className="font-Jakarta mt-2 ml-2 mr-10 min-h-[80]">
                    {content}
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>

            {/* Comment section */}
            <View className="mt-4 mb-24">
              <Text className="font-JakartaSemiBold text-lg mx-4 pl-2">
                Comments
              </Text>
              {loading && <ActivityIndicator size="large" color="#0076e3" />}
              {error && <Text className="text-red-500 mx-4">{error}</Text>}
              {!loading && !error && postComments.length === 0 && (
                <Text className="text-gray-500 mx-4 min-h-[30px] pl-2">
                  No comments yet.
                </Text>
              )}
              {!loading && !error && postComments.length > 0 && (
                <View className="mx-2 pl-4">
                  {postComments.map((comment) =>
                    renderComment({ item: comment })
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          <View className="flex-row items-center p-4 border-t border-gray-200">
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3"
              placeholder="Write a comment..."
              value={newComment}
              multiline
              scrollEnabled
              onChangeText={handleChangeText}
              onSubmitEditing={isSubmitting ? undefined : handleCommentSubmit}
              editable={!isSubmitting && !isSubmitting}
            />
            <CustomButton
              title={isSubmitting ? "..." : "Send"}
              onPress={handleCommentSubmit}
              disabled={
                newComment.length === 0 || isSubmitting || isPostDeleted
              }
              className="ml-3 w-14 h-10 rounded-md"
              fontSize="sm"
              padding="0"
            />
          </View>
        </KeyboardAvoidingView>
      </SignedIn>
    </SafeAreaView>
  );
};

export default PostScreen;

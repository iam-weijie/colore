import CustomButton from "@/components/CustomButton";
import { icons, temporaryColors } from "@/constants/index";
import { fetchAPI } from "@/lib/fetch";
import { convertToLocal, formatDateTruncatedMonth } from "@/lib/utils";
import { PostComment, PostItColor, UserNicknamePair } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { CommentItem } from "@/components/Comment";
import { useGlobalContext } from "@/app/globalcontext";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects"; // Import sound hook
import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { useNavigationContext } from "@/components/NavigationContext";

import * as Linking from "expo-linking";
import { SafeAreaView } from "react-native-safe-area-context";

interface GestureContext {
  startX: number;
  startY: number;
}

interface PostCommentGroup {
  date: string;
  comments: PostComment[]
}



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
    username = "",
    like_count,
    report_count,
    created_at,
    unread_comments = 0,
    anonymous = "",
    color,
    saved,
  } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef(null);
  const [postComments, setPostComments] = useState<PostCommentGroup[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [nicknames, setNicknames] = useState<UserNicknamePair[]>([]);
  const [anonymousComments, setAnonymousComments] = useState<boolean>(
    anonymous === "true"
  );
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
  const userId = Array.isArray(clerk_id) ? clerk_id[0] : clerk_id;
  const screenHeight = Dimensions.get("screen").height;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPostDeleted, setIsPostDeleted] = useState(false);
  const postColor = temporaryColors.find(
    (c) => c.name === color
  ) as PostItColor;
  const { stateVars, setStateVars } = useNavigationContext();
  const { replyTo, setReplyTo, scrollTo, setScrollTo, isIpad, soundEffectsEnabled } = useGlobalContext(); // Add soundEffectsEnabled
  const { playSoundEffect } = useSoundEffects(); // Get sound function
  const [replyView, setReplyView] = useState<PostComment | null>(null);
  const inputRef = useRef(null);


  const fetchCommentById = async (id: string) => {
    try {
      const response = await fetchAPI(`/api/comments/getCommentsById?id=${id}`);

      setReplyView(response.data[0] || null); // Return null if no post is found
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    if (replyTo) {
    fetchCommentById(replyTo)
    } else {
      setReplyView(null)
    }
  }, [replyTo])
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

  useFocusEffect(
    useCallback(() => {
      setAnonymousComments(anonymous === "true");
      setReplyTo(null)
      setReplyView(null)
      return () => {
        setReplyTo(null)
        setStateVars({ ...stateVars, queueRefresh: true});
      }
    }, [])
  );

  // Updated like handler
  const handleLikePress = async () => {
    if (!id || !user?.id || isLoadingLike) return;

    // Play like sound if enabled
    if (soundEffectsEnabled) {
      playSoundEffect(SoundType.Like);
    }

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

  useEffect(() => {
    scrollToItem()
  }, [scrollTo])

  const scrollToItem = () => {
   // Find the index of the group that contains the target comment
   const groupIndex = postComments.findIndex((p) =>
    p.comments.some(item => item.id == scrollTo)
  );

  console.log("groupIndex:", groupIndex);

  // Scroll to the group's index if valid
  if (groupIndex !== -1 && flatListRef.current) {
    flatListRef.current.scrollToIndex({ index: groupIndex });
  }
  };

  const fetchComments = async () => {
    //setLoading(true);
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
      interface CommentResponse {
        id: number;
        is_liked: boolean;
        like_count: number;
        created_at: string; // Ensure your comments have a created_at field
      }
  
      const likeStatuses: { [key: number]: boolean } = {};
      const likeCounts: { [key: number]: number } = {};
  
      (response.data as CommentResponse[]).forEach((comment) => {
        likeStatuses[comment.id] = comment.is_liked || false;
        likeCounts[comment.id] = comment.like_count || 0;
      });
  
      // Group comments by date
      const groupedComments = response.data.reduce((acc, comment) => {
        const commentDate = new Date(comment.created_at).toDateString(); // Convert to a readable date
        const existingGroup = acc.find(group => group.date === commentDate);
  
        if (existingGroup) {
          existingGroup.comments.push(comment);
        } else {
          acc.push({ date: commentDate, comments: [comment] });
        }
  
        return acc;
      }, [] as { date: string; comments: CommentResponse[] }[]);
  
      setPostComments(groupedComments);
      setCommentLikes(likeStatuses);
      setCommentLikeCounts(likeCounts);} catch (error) {
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

    // Play comment sound if enabled
    if (soundEffectsEnabled) {
      playSoundEffect(SoundType.Comment);
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
          replyId: replyTo ?? null
        }),
      });

      if (response.error) {
        console.error("API Error:", response.error);
        throw new Error(response.error);
      }

      setReplyTo("")
      setReplyView(null)
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
    if (anonymous === "true") {
      return;
    }
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

  const handleReadComments = async () => {
    if (clerk_id === user!.id) {
      try {
        console.log("Patching comments")
        await fetchAPI(`/api/posts/updateUnreadComments`, {
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


  useEffect(() => {
    fetchComments();
  }, [id, scrollTo]);

  useEffect(() => {
    if (replyView) {
    setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [replyView])

  useEffect(() => {
    navigation.addListener("beforeRemove", (e) => {
      handleReadComments()
      setStateVars({ ...stateVars, queueRefresh: true });
      console.log("User goes back from post screen");
    });
  }, []);

  const renderCommentItem = ({
    item,
  }: {
    item: { date: string; comments: PostComment[] };
  }): React.ReactElement => {
    // Find the index of the current item in postComments only once

    return (
      <View style={{ marginBottom: 15 }}>
      {/* Show the date as the header */}
      <Text className="text-gray-500 text-center text-[12px]">{item.date}</Text>

      {/* Render each comment in the group */}
      {item.comments.map((comment, index) => (
        <CommentItem
          key={comment.id}
          id={comment.id}
          user_id={comment.user_id}
          sender_id={clerk_id}
          post_id={comment.post_id}
          username={
            anonymousComments ? "" :
            index > 0 ? (item.comments[index - 1].username == comment.username ? "" : comment.username) : comment.username

          }
          like_count={comment.like_count|| 0}
          content={comment.content}
          created_at={comment.created_at}
          report_count={comment.report_count}
          is_liked={commentLikes[comment.id]}
          postColor={postColor?.hex}
          reply_comment_id={comment.reply_comment_id}
        />
      ))}
    </View>

    );
  };

  return (
    <SafeAreaView className="flex-1">
    <SignedIn>
      <KeyboardAvoidingView behavior={"padding"} style={{ flex: 1 }}>
        <View className="flex-1">
          <View className="flex-row justify-between items-center mx-6 my-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <AntDesign name="caretleft" size={18} />
            </TouchableOpacity>
            <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: "/root/new-personal-post",
                params: { 
                  recipient_id: clerk_id,
                  source: 'board'
                }
              })
            }}
            className="py-3 px-4 bg-white rounded-[24px] shadow-xs">
              <Text className="font-JakartaSemiBold" style={{
                color: postColor?.fontColor ?? color 
              }}>Reply to {anonymousComments ? "Author" : username}</Text>
            </TouchableOpacity>
          </View>
          <View 
          className="mb-6 p-6 rounded-[24px] mx-auto flex flex-row items-center justify-between"
          style={{
            backgroundColor: postColor?.hex ?? color,
            width: isIpad ? "95%" : "90%"
          }}>
            <View className="flex-1">
              <TouchableOpacity onPress={() => handleUserProfile(userId)}>
                <Text className="font-JakartaSemiBold text-lg">
                  {anonymousComments
                    ? clerk_id === user!.id
                      ? "Me"
                      : "Anonymous"
                    : username}
                </Text>
              </TouchableOpacity>
              <Text className="text-sm text-gray-700">
                {typeof created_at === "string"
                  ? formatDateTruncatedMonth(
                      convertToLocal(new Date(created_at))
                    )
                  : "No date"}
              </Text>
              <TouchableWithoutFeedback
                onPress={() => Keyboard.dismiss()}
                onPressIn={() => Keyboard.dismiss()}
              >
                <ScrollView
                  style={{ maxHeight: screenHeight / 6 }}
                  showsVerticalScrollIndicator={false}
                >
                  <Text className="font-Jakarta min-h-[30]">{content}</Text>
                </ScrollView>
              </TouchableWithoutFeedback>
            </View>
            <View className="flex flex-row justify-center items-center">
                <View>
                  {/* Only show like count to post creator */}
                  <Text
                    className={`${clerk_id === user?.id ? "text-gray-800" : "text-transparent"} text-center mr-1 text-sm`}
                  >
                    {clerk_id === user?.id ? likeCount : "0"}
                  </Text>
                </View>
                  <TouchableOpacity
                    onPress={handleLikePress}
                    disabled={isLoadingLike}
                  >
                    <MaterialCommunityIcons
                      name={isLiked ? "heart" : "heart-outline"}
                      size={24}
                      color={isLiked ? "red" : "black"}
                    />
                  </TouchableOpacity>
                </View>
          </View>
          <View className="flex-1">
            {/* Comment section */}
            <View className="h-full">
              {loading && <ActivityIndicator size="small" color="#d1d1d1" />}
              {error && <Text className="text-red-500 mx-4">{error}</Text>}
              {!loading && !error && postComments.length === 0 && (
                <Text className="text-gray-500 mx-4 mt-4 min-h-[30px] pl-2 text-center">
                  No messages yet.
                </Text>
              )}
              {!loading && !error && postComments.length > 0 && (
                <FlatList
                  ref={flatListRef}
                  data={postComments}
                  className="rounded-[20px] mx-4"
                  renderItem={renderCommentItem}
                  keyExtractor={(item) => item.date as unknown as string}
                  contentContainerStyle={{ padding: 16 }}
                  style={{ flexGrow: 1 }}
                  extraData={postComments}
                  onContentSizeChange={() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </View>

<View className="flex flex-col">
{replyView && 
<View
className="mt-2 -mb-1 ml-5 flex flex-row"
>
  <Text   
  className="ml-1 text-[14px] italic max-w-[80%]"
  numberOfLines={2}
  style={{
    color:"#757575"
  }}
            >Reply to : {replyView.content}
            </Text>
</View>}
          <View className="flex-row items-center p-4">
            <TextInput
              ref={inputRef}
              className="flex-1 border-[1px] border-gray-300 rounded-[20px] px-4 py-3"
              placeholder="Write a something..."
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
              className="ml-3 w-14 h-10 rounded-full shadow-none"
              style={{ backgroundColor: postColor ? (postColor.hex || color) : "black" }}
              fontSize="sm"
              padding="0"
            />
          </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SignedIn>
  </SafeAreaView>
  );
};

export default PostScreen;
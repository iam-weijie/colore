import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants/index";
import { fetchAPI } from "@/lib/fetch";
import { PostComment } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserNicknamePair } from "@/types/type";
import { formatDateTruncatedMonth, convertToLocal } from "@/lib/utils";

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
    like_count,
    report_count,
    created_at,
    unread_comments = 0,
  } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<PostComment[]>([]);
  const [likedPost, setLikedPost] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>("");
  const [likedComment, setLikedComment] = useState<boolean>(false);
  const [nicknames, setNicknames] = useState<UserNicknamePair[]>([]);

  const maxCharacters = 6000;
  const displayName = Array.isArray(firstname) ? firstname[0] : firstname; // to correct type warning
  const userId = Array.isArray(clerk_id) ? clerk_id[0] : clerk_id;
  const screenHeight = Dimensions.get("screen").height;

  function findUserNickname(userArray: UserNicknamePair[], userId: string): number {
    const index = userArray.findIndex(pair => pair[0] === userId);
    return index;
  }
  const fetchNicknames = async () => {
    try {
        // console.log("user: ", user!.id);
        const response = await fetchAPI(
          `/(api)/(users)/getUserInfo?id=${user!.id}`,
          {
            method: "GET",
          }
        );
        if (response.error) {
          console.log("Error fetching user data");
          console.log("response data: ", response.data);
          console.log("response status: ", response.status);
          // console.log("response: ", response);
          throw new Error(response.error);
        }
        // console.log("response: ", response.data[0].nicknames);
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
    try {
      const response = await fetchAPI(
        `/(api)/(comments)/getComments?id=${id}`,
        {
          method: "GET",
        }
      );
      if (response.error) {
        throw new Error(response.error);
      }
      const comments = response.data;
      setPostComments(comments);
    } catch (error) {
      setError("Failed to fetch comments.");
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetchAPI(`/(api)/(comments)/newComment`, {
        method: "POST",
        body: JSON.stringify({
          content: newComment,
          postId: id,
          postClerkId: clerk_id,
          clerkId: user?.id,
        }),
      });

      setNewComment("");
      fetchNicknames();
      fetchComments();
    } catch (error) {
      Alert.alert("Error", "Failed to submit comment.");
      console.error("Failed to submit comment:", error);
    }
  };

  const handleDeletePostPress = async () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel" },
      { text: "Delete", onPress: handleDeletePost },
    ]);
  };

  const handleDeletePost = async () => {
    await fetchAPI(`/(api)/(posts)/deletePostComments?id=${id}`, {
      method: "DELETE",
    });

    await fetchAPI(`/(api)/(posts)/deletePost?id=${id}`, {
      method: "DELETE",
    });

    Alert.alert("Post deleted.");
    router.back();
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
      await fetchAPI(`/(api)/(comments)/deleteComment?id=${id}`, {
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
      pathname: "/(root)/(profile)/[id]",
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
      console.log("User goes back from post screen");
    });
    
  }, []);

  // before returning user to screen, update unread_comments to 0
  // only if the user is viewing their own post
  const handleReadComments = async () => {
    if (clerk_id === user!.id) {
      try {
        const response = await fetchAPI(`/(api)/(posts)/updateUnreadComments`, {
          method: "PATCH",
          body: JSON.stringify({
            clerkId: user?.id,
            postId: id,
            postClerkId: clerk_id,
          }),
        })
      } catch (error) {
        console.error("Failed to update unread comments:", error);
      }
    }
  }

  const renderComment = ({ item }: { item: PostComment }) => (
    <View key={item.id} className="p-4 border-b border-gray-200">
      <TouchableOpacity
        onPress={() => {
          handleUserProfile(item.user_id);
        }}
      >
        <Text className="font-JakartaSemiBold">
          {findUserNickname(nicknames, item.user_id)===-1 ? item.username ? `${item.username}` : `${item.firstname.charAt(0)}.`:nicknames[findUserNickname(nicknames, item.user_id)][1]}
        </Text>
      </TouchableOpacity>
      <Text className="text-sm text-gray-500">
        {formatDateTruncatedMonth(convertToLocal(new Date(item.created_at)))}
      </Text>
      <View className="flex flex-row mr-2">
        <Text className="flex-1 font-Jakarta">{item.content}</Text>
        <View className="flex flex-col items-center">
          <TouchableOpacity onPress={() => setLikedComment(!likedComment)}>
            <MaterialCommunityIcons
              name={likedComment ? "heart" : "heart-outline"}
              size={24}
              color={likedComment ? "red" : "black"}
            />
          </TouchableOpacity>
          {item.user_id === user?.id && (
            <TouchableOpacity onPress={() => handleDeleteCommentPress(item.id)}>
              <Image source={icons.trash} className="mt-3 w-5 h-5" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <KeyboardAvoidingView behavior={"padding"} style={{ flex: 1 }}>
        <View className="flex flex-row justify-center items-center mt-3 mx-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <AntDesign name="caretleft" size={18} />
          </TouchableOpacity>

          <View className="flex-1">
            <TouchableOpacity onPress={() => handleUserProfile(userId)}>
              <Text className="font-JakartaSemiBold text-lg">
                {nickname || displayName.charAt(0) + "."}
              </Text>
            </TouchableOpacity>
              <Text className="text-sm text-gray-500">
                {typeof created_at === "string"
                  ? formatDateTruncatedMonth(convertToLocal(new Date(created_at)))
                  : "No date"}
              </Text>
          </View>
        </View>
        <ScrollView>
          <TouchableWithoutFeedback
            onPress={() => Keyboard.dismiss()}
            onPressIn={() => Keyboard.dismiss()}
          >
          {/* Post information */}
            <View className="p-4 border-b border-gray-200 relative">
              <View className="absolute top-4 right-4 items-center mt-2">
                <TouchableOpacity onPress={() => setLikedPost(!likedPost)}>
                  <MaterialCommunityIcons
                    name={likedPost ? "heart" : "heart-outline"}
                    size={32}
                    color={likedPost ? "red" : "black"}
                  />
                </TouchableOpacity>
                {clerk_id === user?.id && (
                  <TouchableOpacity onPress={handleDeletePostPress} className="mt-4">
                    <Image source={icons.trash} className="w-7 h-7" />
                  </TouchableOpacity>
                )}
              </View>
              <Text className="font-Jakarta mt-2 ml-2 mr-10 min-h-[80]">{content}</Text>
            </View>
          </TouchableWithoutFeedback>


          {/* Comment section */}
          <View className="mt-4 mb-24">
            <Text className="font-JakartaSemiBold text-lg mx-4">Comments</Text>
            {loading && <ActivityIndicator size="large" color="#0076e3" />}
            {error && <Text className="text-red-500 mx-4">{error}</Text>}
            {!loading && !error && postComments.length === 0 && (
              <Text className="text-gray-500 mx-4 min-h-[30px]">
                No comments yet.
              </Text>
            )}
            {!loading && !error && postComments.length > 0 && (
              <View className="mx-2">
                {postComments.map((comment) =>
                  renderComment({ item: comment })
                )}
              </View>
            )}
          </View>
        </ScrollView>
        
          <View className="flex-row justify-between items-center bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
            <TextInput
              className="flex-1 border border-gray-300 rounded-md p-2 max-h-30 mr-16"
              placeholder="Write a comment..."
              value={newComment}
              multiline
              scrollEnabled
              onChangeText={handleChangeText}
              onSubmitEditing={handleCommentSubmit}
              style={{
                paddingTop: 10,
                paddingBottom: Platform.OS === "android" ? 0 : 10,
                maxHeight: screenHeight * 0.35,
                textAlignVertical: "top",
              }}
            />
            <CustomButton
              title="Send"
              onPress={handleCommentSubmit}
              disabled={newComment.length === 0}
              className="absolute bottom-4 ml-3 w-14 h-9 rounded-md absolute bottom-4 right-4"
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

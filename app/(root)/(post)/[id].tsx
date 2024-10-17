import CustomButton from "@/components/CustomButton";
import { fetchAPI } from "@/lib/fetch";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Alert,
  Dimensions,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { PostComment } from "@/types/type";
import { icons } from "@/constants/index";

const PostScreen  = () => {
  const { user } = useUser();
  const router = useRouter();
  const {
    id,
    clerk_id,
    content,
    nickname,
    firstname,
    like_count,
    report_count,
    created_at,
  } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<PostComment[]>([]);
  const [likedPost, setLikedPost] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>("");

  const { height } = Dimensions.get("window");

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
        body: JSON.stringify({ content: newComment, postId: id, clerkId: user?.id }),
      });

      if (response.error) {
        throw new Error(response.error);
      }
      setNewComment("");
      fetchComments();
    } catch (error) {
      Alert.alert("Error", "Failed to submit comment.");
      console.error("Failed to submit comment:", error);
    }
  };


  const handleDeletePress = async () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel" },
      { text: "Delete", onPress: handleDelete },
    ]);
  };

  const handleDelete = async () => {
    await fetchAPI(`/(api)/(posts)/deletePost?id=${id}`, {
      method: "DELETE",
    });

    Alert.alert("Post deleted.");
    router.back();
  };

  const handleUserProfile = async (id: string) => {
    router.push({
      pathname: "/(root)/(profile)/[id]",
      params: { id }
    })
  }

  useEffect(() => {
    fetchComments();
  }, [id]);

  const renderComment = ({ item }: { item: PostComment }) => (
    <View className="p-4 border-b border-gray-200">
      <TouchableOpacity onPress={() => {handleUserProfile(item.user_id)}}>
        <Text className="font-JakartaSemiBold">
          {item.firstname.charAt(0)}. 
        </Text>
      </TouchableOpacity>
      <Text>{item.content}</Text>
      <Text className="text-sm text-gray-500">{new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <TouchableWithoutFeedback
          onPress={() => Keyboard.dismiss()}
          onPressIn={() => Keyboard.dismiss()}
        >
          <View className="flex flex-row justify-center items-center mt-3 mx-4">
            <View className="flex-1">
              <TouchableOpacity onPress={() => router.back()}>
                <AntDesign name="caretleft" size={18} color="0076e3" />
              </TouchableOpacity>
            </View>
            <Text className="absolute text-xl font-JakartaSemiBold">
              Post
            </Text>
          </View>
        </TouchableWithoutFeedback>
        <ScrollView>
          {/* Post information */}
          <View className="p-4 border-b border-gray-200">
            <Text className="font-JakartaSemiBold text-lg">
              {nickname || firstname}
            </Text>
            <Text className="text-sm text-gray-500">
              {typeof created_at === "string" ? new Date(created_at).toLocaleString() : "No date"}
            </Text>
            <Text className="mt-2">{content}</Text>

            <View className="my-2 flex-row justify-between items-center">
              <TouchableOpacity onPress={() => setLikedPost(!likedPost)}>
                <MaterialCommunityIcons
                  name={likedPost ? "heart" : "heart-outline"}
                  size={32}
                  color={likedPost ? "red" : "black"}
                />
              </TouchableOpacity>
              {clerk_id === user?.id && (
                <TouchableOpacity onPress={handleDeletePress}>
                  <Image source={icons.trash} className="w-7 h-7" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Comment section */}
          <View className="mt-4 mb-24">
            <Text className="font-JakartaSemiBold text-lg mx-4">Comments</Text>
            {loading && (
              <ActivityIndicator size="large" color="#0076e3" />
            )}
            {error && (
              <Text className="text-red-500 mx-4">{error}</Text>
            )}
            {!loading && !error && postComments.length === 0 && (
              <Text className="text-gray-500 mx-4 min-h-[30px]">No comments yet.</Text>
            )}
            {!loading && !error && postComments.length > 0 && (
              <View className="mx-2">
                {postComments.map((comment) => renderComment({ item: comment }))}
              </View>
            )}
          </View>
        </ScrollView>
        <View className="flex-row justify-between items-center absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <TextInput
            style={{ flex: 1, borderColor: '#ccc', borderWidth: 1, borderRadius: 5, padding: 8 }}
            placeholder="Write a comment..."
            value={newComment}
            onChangeText={setNewComment}
            onSubmitEditing={handleCommentSubmit}
          />
          <CustomButton
            title="Send"
            onPress={handleCommentSubmit} 
            disabled={newComment.length === 0}
            className="ml-3 w-14 h-8 rounded-md"
            fontSize="sm"
            padding="0"
          />
        </View>
      </SignedIn>
    </SafeAreaView>
  );  
};

export default PostScreen;

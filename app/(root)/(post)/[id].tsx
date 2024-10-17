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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { PostComment } from "@/types/type";
import { icons } from "@/constants/index";

const PostScreen = () => {
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
  const [postComments, setpostComments] = useState<PostComment[]>([]);
  const [likedPost, setLikedPost] = useState<boolean>(false);

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
      console.log(comments);
    } catch (error) {
      setError("Failed to fetch comments.");
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchComments();
  }, [id]);

  const renderComment = ({ item }: { item: PostComment }) => (
    <View className="p-4 border-b border-gray-200">
      <Text className="font-JakartaSemiBold">
        {item.firstname} 
      </Text>
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
          <View>
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
  
            <View className="p-4 border-b border-gray-200">
              <Text className="font-JakartaSemiBold text-lg">
                {nickname || firstname}
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
                  <TouchableOpacity onPress={() => {}}>
                    <Image source={icons.trash} className="w-7 h-7" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </SignedIn>
    </SafeAreaView>
  );  
};

export default PostScreen;

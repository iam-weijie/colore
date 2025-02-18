import PostIt from "@/components/PostIt";
import PostModal from "@/components/PostModal";
import { useGlobalContext } from "@/app/globalcontext";
import { icons } from "@/constants";
import { Post, PostWithPosition } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import PostItBoard from "@/components/PostItBoard";
import { fetchAPI } from "@/lib/fetch";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AntDesign from "@expo/vector-icons/AntDesign";

export default function PersonalBoard() {
  const { user } = useUser();
  const { id } = useLocalSearchParams(); // For viewing other users' boards
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  const isOwnBoard = !id || id === user?.id;

  const fetchUserData = async () => {
    if (!isOwnBoard) {
      try {
        const response = await fetchAPI(`/api/users/getUserInfo?id=${id}`);
        setProfileUser(response.data[0]);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setError("Failed to load profile");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const fetchPersonalPosts = async () => {
    const userId = isOwnBoard ? user!.id : id;
    const response = await fetchAPI(
      `/api/posts/getPersonalPosts?number=${4}&recipient_id=${userId}`
    );
    return response.data;
  };

  const fetchNewPersonalPost = async () => {
    try {
      const response = await fetchAPI(
        `/api/posts/getPersonalPosts?number=${1}&recipient_id=${isOwnBoard ? user!.id : id}`
      );
      return response.data[0];
    } catch (error) {
      setError("Failed to fetch new post.");
      console.error(error);
      return null;
    }
  };

  const handleNewPostPress = () => {
    console.log("Navigating to new personal post with params:", {
        recipient_id: isOwnBoard ? user!.id : id,
        source: 'board'
    });
    
    router.push({
        pathname: "/root/new-personal-post",
        params: { 
            recipient_id: isOwnBoard ? user!.id : id,
            source: 'board'
        }
    });
};

  if (loading) {
    return (
      <View className="flex-[0.8] justify-center items-center">
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500">{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <View className="flex-row justify-between items-center mx-7 mt-3">
          {!isOwnBoard && (
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <AntDesign name="caretleft" size={18} />
            </TouchableOpacity>
          )}
          
          <Text className="text-xl font-JakartaBold">
            {isOwnBoard ? "My Personal Board" : `${profileUser?.username}'s Board`}
          </Text>

          <TouchableOpacity onPress={handleNewPostPress}>
            <Image source={icons.pencil} className="w-7 h-7" />
          </TouchableOpacity>
        </View>

        <PostItBoard 
          userId={isOwnBoard ? user!.id : id as string}
          handlePostsRefresh={fetchPersonalPosts}
          handleNewPostFetch={fetchNewPersonalPost}
          onWritePost={handleNewPostPress}
          allowStacking={true}
        />
      </SignedIn>
    </SafeAreaView>
  );
}
import PostItBoard from "@/components/PostItBoard";
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { SignedIn, useUser } from "@clerk/clerk-expo";
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
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function PersonalBoard() {
  const { user } = useUser();
  const { id, refresh } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [shouldRefresh, setShouldRefresh] = useState(0); // Add a refresh counter
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

  // Use useFocusEffect to refresh when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Increment refresh counter to trigger re-render
      setShouldRefresh(prev => prev + 1);
    }, [])
  );

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const fetchPersonalPosts = async () => {
    const userId = isOwnBoard ? user!.id : id;
    const viewerId = user!.id;
    const response = await fetchAPI(
      `/api/posts/getPersonalPosts?user_id=${viewerId}&recipient_id=${userId}`
    );
    return response.data;
  };

  const fetchNewPersonalPost = async () => {
    try {
      const response = await fetchAPI(
        `/api/posts/getPersonalPosts?number=1&user_id=${user!.id}&recipient_id=${isOwnBoard ? user!.id : id}`
      );
      const newPost = response.data[0];
      if (!newPost) {
        return null;
      }
      return {
        ...newPost,
        position: {
          top: Math.random() * 400 + 50,
          left: Math.random() * 250,
        },
      };
    } catch (error) {
      setError("Failed to fetch new post.");
      console.error(error);
      return null;
    }
  };

  const handleNewPost = () => { 
    const targetId = isOwnBoard ? user!.id : id;
    router.push({
      pathname: "/root/new-personal-post",
      params: { 
        recipient_id: targetId,
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
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <AntDesign name="caretleft" size={18} />
          </TouchableOpacity>
          
          <Text className="text-xl font-JakartaBold">
            {isOwnBoard ? "My Personal Board" : `${profileUser?.username}'s Board`}
          </Text>

          <TouchableOpacity onPress={handleNewPost}>
            <Image source={icons.pencil} className="w-7 h-7" />
          </TouchableOpacity>
        </View>

        <PostItBoard 
          key={shouldRefresh} // Add key to force re-render when shouldRefresh changes
          userId={isOwnBoard ? user!.id : id as string}
          handlePostsRefresh={fetchPersonalPosts}
          handleNewPostFetch={fetchNewPersonalPost}
          onWritePost={handleNewPost}
          allowStacking={true}
        />
      </SignedIn>
    </SafeAreaView>
  );
}
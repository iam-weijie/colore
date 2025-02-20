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
import { Post } from "@/types/type";

type PersonalBoardProps = {
    userId: string;
}

const PersonalBoard: React.FC<PersonalBoardProps> = ({ userId }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [shouldRefresh, setShouldRefresh] = useState(0); // Add a refresh counter
  const isOwnBoard = !userId || userId === user?.id;

  const fetchUserData = async () => {
    if (!isOwnBoard) {
      try {
        const response = await fetchAPI(`/api/users/getUserInfo?id=${userId}`);
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
  }, [userId]);

  const fetchPersonalPosts = async () => {
    const viewerId = user!.id;
    const response = await fetchAPI(
      `/api/posts/getPersonalPosts?recipient_id=${userId}&user_id=${viewerId}`
    );
    
    // Validate and format each post
    const formattedPosts = response.data.map((post: Post) => ({
      ...post,
      like_count: post.like_count || 0,
      report_count: post.report_count || 0,
      unread_comments: post.unread_comments || 0
    }));
    
    return formattedPosts;
  };

  const fetchNewPersonalPost = async () => {
    try {
      const response = await fetchAPI(
        `/api/posts/getPersonalPosts?number=1&user_id=${userId}&recipient_id=${user!.id}`
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
    router.push({
      pathname: "/root/new-personal-post",
      params: { 
        recipient_id: userId,
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
        <PostItBoard 
          key={shouldRefresh} // Add key to force re-render when shouldRefresh changes
          userId={userId}
          handlePostsRefresh={fetchPersonalPosts}
          handleNewPostFetch={fetchNewPersonalPost}
          onWritePost={handleNewPost}
          allowStacking={true}
        />
      </SignedIn>
    </SafeAreaView>
  );
}

export default PersonalBoard;
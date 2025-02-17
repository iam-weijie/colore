import PostIt from "@/components/PostIt";
import PostModal from "@/components/PostModal";
import { useGlobalContext } from "@/app/globalcontext";
import { Post, PostWithPosition } from "@/types/type";
import { useNotification } from '@/notifications/NotificationContext';
import { sendPushNotification } from '@/notifications/PushNotificationService';


import { SignedIn, useUser } from "@clerk/clerk-expo";
import PostItBoard from "@/components/PostItBoard";
import { fetchAPI } from "@/lib/fetch";
import { useEffect, useRef, useState } from "react";
import * as React from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  PanResponder,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { icons } from "@/constants";

export default function Page() {

  const { pushToken } = useNotification();
  const [posts, setPosts] = useState<PostWithPosition[]>([]);
  const {stacks, setStacks } = useGlobalContext(); // Add more global constants here
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostWithPosition | null>(null);
  const { user } = useUser();

  const fetchPosts = async () => {
    const response = await fetchAPI(`/api/posts/getRandomPosts?number=${4}&id=${user!.id}`);
    return response.data;
  };

  const fetchNewPost = async () => {
    try {
      const response = await fetch(
        `/api/posts/getRandomPosts?number=${1}&id=${user!.id}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const result = await response.json();
      // Add position to the new post
      const newPostWithPosition = result.data.map((post: Post) => ({
        ...post,
        position: {
          top: Math.random() * 500,
          left: Math.random() * 250,
        },
      }));
      return newPostWithPosition[0];
    } catch (error) {
      setError("Failed to fetch new post.");
      console.error(error);
      return null;
    }
  };

  const handleNewPostPress = () => {
      router.push("/root/new-post");
  };

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <View className="flex-row justify-between items-center mx-7 mt-3">
          <Image
            source={require("@/assets/colore-word-logo.png")}
            style={{ width: 120, height: 50 }}
            resizeMode="contain"
            accessibilityLabel="Colore logo"
          />
          <TouchableOpacity onPress={handleNewPostPress}>
            <Image source={icons.pencil} className="w-7 h-7" />
          </TouchableOpacity>
        </View>
        <PostItBoard 
          userId={user!.id}
          handlePostsRefresh={fetchPosts}
          handleNewPostFetch={fetchNewPost}
          onWritePost={handleNewPostPress}
          allowStacking={true}
        />
      </SignedIn>
    </SafeAreaView>
  );
}

import { Post } from "@/types/type";
import PostItBoard from "@/components/PostItBoard";
import { fetchAPI } from "@/lib/fetch";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import * as React from "react";
import { useState, useEffect } from "react";

import { icons } from "@/constants";
import { router } from "expo-router";
import { Image, SafeAreaView, TouchableOpacity, View, Alert } from "react-native";
import { requestTrackingPermission } from 'react-native-tracking-transparency';

export default function Page() {
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const requestPermission = async () => {
    const status = await requestTrackingPermission();
    if (status === 'authorized') {
      console.log('Tracking permission granted!');
    } else {
      console.log('Tracking permission denied or restricted.');
    }
  };
  
  useEffect(() => {
    requestPermission();
  }, []);

  const fetchPosts = async () => {
    const response = await fetchAPI(
      `/api/posts/getRandomPosts?number=${4}&id=${user!.id}`
    );
    return response.data;
  };

  const fetchNewPost = async (excludeIds: number[]) => {
    try {
      const excludeIdsParam = excludeIds.join(",");
      const response = await fetch(
        `/api/posts/getRandomPostsExcluding?number=${1}&id=${user!.id}&exclude_ids=${excludeIdsParam}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const result = await response.json();
      // Add position to the new post
      const newPostWithPosition = result.data.map((post: Post) => ({
        ...post,
        position: {
          top: Math.random() * 775 / 2,
          left: Math.random() * 475 / 2,
        },
      }));
      if (newPostWithPosition.length > 0) return newPostWithPosition[0];
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
        <View className="flex-row justify-between items-center mx-7 mt-5">
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
          allowStacking={true}
        />
      </SignedIn>
    </SafeAreaView>
  );
}

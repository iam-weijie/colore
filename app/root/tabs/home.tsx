import PostItBoard from "@/components/PostItBoard";
import { fetchAPI } from "@/lib/fetch";
import { Post, UserData } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import * as React from "react";
import { useEffect, useState } from "react";

import { icons } from "@/constants";
import { router } from "expo-router";
import { Dimensions, Image, SafeAreaView, TouchableOpacity, View, Text } from "react-native";
import { requestTrackingPermission } from "react-native-tracking-transparency";
import { useGlobalContext } from "@/app/globalcontext";

import ActionPrompts from "@/components/ActionPrompts";
import { ActionType } from "@/lib/prompts";
import { GeographicalMode } from "@/types/type";

export default function Page() {
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { isIpad } = useGlobalContext();
  const [action, setAction] = useState(ActionType.NONE)
  const [geographicalMode, setGeographicalMode] = useState<GeographicalMode>('world');

  const requestPermission = async () => {
    const status = await requestTrackingPermission();
    if (status === "authorized") {
      console.log("Tracking permission granted!");
    } else {
      console.log("Tracking permission denied or restricted.");
    }
  };

  useEffect(() => {
    requestPermission();
    fetchUserData()
  }, []);

  const screenHeight = Dimensions.get("screen").height;
  const screenWidth = Dimensions.get("screen").width;
  const AlgorithmRandomPosition = (isPinned: boolean) => {

    if (isPinned) {
      return {top: 60 + Math.random() * 10, left: 40 + Math.random() * 10 }
    } else if (isIpad) {
      const top = ((Math.random() - 0.5) * 2) * screenHeight / 3 + screenHeight / 4;
      const left = ((Math.random() - 0.5) * 2) * screenWidth / 3 + screenWidth - screenWidth / 1.75
      return {
        top:  top,
        left: left
      }
    }
     else {
      const top = ((Math.random() - 0.5) * 2) * screenHeight / 4 + screenHeight / 4;
      const left = ((Math.random() - 0.5) * 2) * screenWidth / 4 + screenWidth / 4
      return {
        top:  top,
        left: left
      }
    }
}
const fetchUserData = async () => {
    try {
      const response = await fetchAPI(`/api/users/getUserInfoPosts?id=${user!.id}`);
      getAction(response.posts[0]);
      
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setError("Failed to load profile");
    }
  

};

  const fetchPosts = async () => {
    const response = await fetchAPI(
      `/api/posts/getRandomPosts?number=${isIpad ? 8 : 4}&id=${user!.id}&mode=${geographicalMode}`
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
          top:  AlgorithmRandomPosition(false).top,
          left: AlgorithmRandomPosition(false).left,
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

  const getAction = (lastPost: Post) => {
    if (lastPost) {
    const lastConnection = lastPost.created_at
    const daysDifference = (Date.now() - new Date(lastConnection).getTime()) / (1000 * 60 * 60 * 24)


    if (daysDifference > 1.5) {
      setAction(ActionType.TIPS)
    }
  } else {
    setAction(ActionType.TIPS)
  }
  }
  const GeographicalModeSelector = () => {
    const modes: GeographicalMode[] = ['city', 'state', 'country', 'world'];
    
  const handleGeographicalModeChange = (mode: GeographicalMode) => {
    setGeographicalMode(mode);
    console.log("Geographical mode changed to:", mode);
     // Fetch posts again when mode changes
  }
    return (
      <View 
        className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-l-lg p-1 shadow-lg"
        style={{ width: 70 }}
      >
        {modes.map((mode) => (
          <TouchableOpacity
            key={mode}
            onPress={() => handleGeographicalModeChange(mode)}
            className={`p-2 my-1 rounded ${
              geographicalMode === mode 
                ? 'bg-blue-500' 
                : 'bg-gray-200'
            }`}
          >
            <Text 
              className={`text-center text-xs ${
                geographicalMode === mode 
                  ? 'text-white' 
                  : 'text-black'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
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
          mode={geographicalMode}
        />
        <GeographicalModeSelector />
        <ActionPrompts 
          friendName={""}
          action={action} 
          handleAction={() => {}}
        />
      </SignedIn>
    </SafeAreaView>
  );
}

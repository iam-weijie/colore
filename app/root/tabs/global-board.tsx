import PostModal from "@/components/PostModal";
import { fetchAPI } from "@/lib/fetch";
import { Post, UserData } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import * as React from "react";
import { useEffect, useState, useCallback } from "react";

import { icons } from "@/constants";
import { router, useFocusEffect } from "expo-router";
import { Dimensions, Image, SafeAreaView, TouchableOpacity, View } from "react-native";
import { requestTrackingPermission } from "react-native-tracking-transparency";
import { useGlobalContext } from "@/app/globalcontext";


export default function Page() {
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { isIpad, stacks, setStacks } = useGlobalContext();
  const [userInfo, setUserInfo] = useState(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [excludedIds, setExcludedIds] = useState<number[]>([]); // Track IDs to exclude
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const skeletonPost = {
    id: 0,
    clerk_id: "",
    user_id: "", 
    firstname: "",
    username: "",
    content: "",
    created_at: "",
    city: "",
    state: "",
    country: "",
    like_count: 0,
    report_count: 0,
    unread_comments: 0,
    recipient_user_id: "",
    pinned: false,
    color: "yellow", 
    emoji: "",
    notified: true
  };

  const requestPermission = async () => {
    const status = await requestTrackingPermission();
    if (status === "authorized") {
      console.log("Tracking permission granted!");
    } else {
      console.log("Tracking permission denied or restricted.");
    }
  };

  useFocusEffect(
    useCallback(() => {
        // Fetch all user data including location when screen is focused
        setIsModalVisible(true);
      }, []) // Add back the dependency array for useCallback
    ); // Correctly close useFocusEffect

  useEffect(() => {
    requestPermission();
    fetchUserData();
    fetchPosts();
  }, []);

  const screenHeight = Dimensions.get("screen").height;
  const screenWidth = Dimensions.get("screen").width;

const fetchUserData = async () => {
    try {
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`);
      setUserInfo(response.data[0]);
      
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setError("Failed to load profile");
    }
  

};

  const fetchPosts = async () => {
    setLoading(true);
    try {
    const response = await fetchAPI(
      `/api/posts/getRandomPosts?number=${isIpad ? 8 : 4}&id=${user!.id}`
    );
    setPosts(response.data);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    setError("Failed to load posts");
  } 
    setLoading(false);
}

  const fetchNewPost = async (excludeIds: number[]) => {
    try {
      const excludeIdsParam = excludeIds.join(",");
      const response = await fetch(
        `/api/posts/getRandomPostsExcluding?number=${2}&id=${user!.id}&exclude_ids=${excludeIdsParam}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const result = await response.json();
      // Add position to the new posts
      const newPosts = result.data;
      if (newPosts.length > 0) {
        setPosts((prevPosts) => {
          // Remove the first two posts
          const filteredPosts = prevPosts.slice(2);
          return [...filteredPosts, ...newPosts];
        });
        const stackExists = stacks.some((stack) => {
          return stack.ids.some((id) => posts.map((post) => post.id).includes(id));
        });

        if (stackExists) {
          const updatedStacks = stacks.map((stack) => {
            if (stack.ids.some((id) => posts.map((post) => post.id).includes(id))) {
              return {
                ...stack,
                ids: [...stack.ids, ...newPosts.map((post) => post.id)],
                elements: [...stack.elements, ...newPosts],
              };
            }
            return stack;
          });
          setStacks(updatedStacks);
        }
        setExcludedIds((prev) => [...prev, ...newPosts.map((post) => post.id)]); // Track IDs to exclude
      }

    } catch (error) {
      setError("Failed to fetch new post.");
      console.error(error);
      return null;
    }
  };

  useEffect(() => {
    if (posts.length > 3) {
    const updatedStacks = stacks;
     updatedStacks.push({
        ids: posts.map((post) => post.id),
        elements: posts,
    })
    setStacks(updatedStacks);
    }
      
  }, [posts, isModalVisible]);

  const handleNewPostPress = () => {
    setIsModalVisible(false);
    router.push("/root/new-post");
  };


  const handleCloseModalPress = () => {
    setIsModalVisible(false);
    router.replace("/root/tabs/personal-board");
  };
  console.log("stacks", stacks, "posts", posts.map((post) => post.id), "excludedIds", excludedIds);
  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
    <PostModal
    isVisible={isModalVisible}
    selectedPost={loading ? skeletonPost : posts[0]}
    handleCloseModal={handleCloseModalPress}
    header={
      <View className="absolute top-5 right-7 flex-row items-center justify-center ">
          <TouchableOpacity onPress={handleNewPostPress}>
            <Image source={icons.pencil} tintColor="black" className="w-7 h-7 p-7 rounded-[50%]" />
          </TouchableOpacity>
        </View>
    }
    />
      </SignedIn>
    </SafeAreaView>
  );
}

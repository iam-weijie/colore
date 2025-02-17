import { SignedIn, useUser } from "@clerk/clerk-expo";
import PostItBoard from "@/components/PostItBoard";
import { Post } from "@/types/type";
import { useState } from "react";
import { fetchAPI } from "@/lib/fetch";
import { 
  Text, 
  SafeAreaView, 
  View, 
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";

export default function Page() {
  const { user } = useUser();

  const fetchPosts = async () => {
    const response = await fetchAPI(`/api/posts/getRandomPosts?number=${4}&id=${user!.id}`);
    return response.data;
  };

  const fetchNewPost = async () => {
    const response = await fetchAPI(`/api/posts/getRandomPosts?number=${1}&id=${user!.id}`);
    return response.data[0];
  };

  const handleNewPostPress = () => {
      router.push("/root/new-post");
  };

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <PostItBoard 
          userId={user!.id}
          handlePostsRefresh={fetchPosts}
          handleNewPostFetch={fetchNewPost}
          onWritePost={handleNewPostPress}
        />
      </SignedIn>
    </SafeAreaView>
  );
}

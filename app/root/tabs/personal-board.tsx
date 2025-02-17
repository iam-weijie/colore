import React from "react";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { SafeAreaView, View, Image, TouchableOpacity } from "react-native";
import { icons } from "@/constants";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import PostItBoard from "@/components/PostItBoard";
import { fetchAPI } from "@/lib/fetch";

declare interface PersonalBoardProps {}

const PersonalBoard: React.FC<PersonalBoardProps> = () => {
  const { user } = useUser();
  
    const fetchPosts = async () => {
      const response = await fetchAPI(`/api/posts/getPersonalPosts?number=${4}&id=${user!.id}`);
      return response.data;
    };
  
    const fetchNewPost = async () => {
      const response = await fetchAPI(`/api/posts/getPersonalPosts?number=${1}&id=${user!.id}`);
      return response.data[0];
    };
  
    const handleNewPostPress = () => {
        router.push("/root/new-post");
    };

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <View className="flex-col justify-end items-end mx-7 mt-6">
          <TouchableOpacity onPress={() => router.push("/root/chat/chat-screen")}>
            <Image
              source={icons.chat}
              className="w-10 h-10"
              style={{ tintColor: "black" }}
            />
          </TouchableOpacity>
          <View className="mt-4">
            <TouchableOpacity
              onPress={() => router.push("/root/friends/friend-screen")}
            >
              <FontAwesome5 name="user-friends" size={30} color="black" />
            </TouchableOpacity>
          </View>
          <View>
            <PostItBoard
              userId={user!.id}
              handlePostsRefresh={fetchPosts}
              handleNewPostFetch={fetchNewPost}
              onWritePost={handleNewPostPress}
              allowStacking={false}
            />
          </View>
        </View>
      </SignedIn>
    </SafeAreaView>
  );
};

export default PersonalBoard;

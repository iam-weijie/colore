import React from "react";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, View, TouchableOpacity, Image } from "react-native";
import { icons } from "@/constants";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import PostItBoard from "@/components/PostItBoard";
import { fetchAPI } from "@/lib/fetch";

const PersonalBoardScreen = () => {
  const { user } = useUser();
  const { id } = useLocalSearchParams();
  const isOwnBoard = user?.id === id;
  
  const fetchPosts = async () => {
    const response = await fetchAPI(`/api/posts/getPersonalPosts?number=${4}&recipient_id=${id}`);
    return response.data;
  };

  const fetchNewPost = async () => {
    const response = await fetchAPI(`/api/posts/getPersonalPosts?number=${1}&recipient_id=${id}`);
    return response.data[0];
  };

  const handleNewPostPress = () => {
    router.push({
      pathname: "/root/new-personal-post",
      params: { recipient_id: id }
    });
  };

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <View className="flex-col justify-end items-end mx-7 mt-6">
          {!isOwnBoard && (
            <TouchableOpacity onPress={() => router.push("/root/chat/chat-screen")}>
              <Image
                source={icons.chat}
                className="w-10 h-10"
                style={{ tintColor: "black" }}
              />
            </TouchableOpacity>
          )}
          {!isOwnBoard && (
            <View className="mt-4">
              <TouchableOpacity
                onPress={() => router.push("/root/friends/friend-screen")}
              >
                <FontAwesome5 name="user-friends" size={30} color="black" />
              </TouchableOpacity>
            </View>
          )}
          <PostItBoard
            userId={id as string}
            handlePostsRefresh={fetchPosts}
            handleNewPostFetch={fetchNewPost}
            onWritePost={handleNewPostPress}
            allowStacking={false}
          />
        </View>
      </SignedIn>
    </SafeAreaView>
  );
};

export default PersonalBoardScreen;
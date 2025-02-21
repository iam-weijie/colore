import React from "react";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import {
  SafeAreaView,
  TouchableOpacity,
  View,
  Image,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import PersonalBoard from "@/components/PersonalBoard";
import { icons } from "@/constants";

const UserPersonalBoard = () => {
  const router = useRouter();
  const { user } = useUser();

  const handleNewPost = () => {
    router.push({
      pathname: "/root/new-personal-post",
      params: {
        recipient_id: user!.id,
        source: "board",
      },
    });
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-row justify-between items-center mx-7 mt-3">
        <Text className="text-2xl font-JakartaBold mt-4">My Board</Text>
        <View className="flex flex-row mt-4 p-1 items-center justify-center border-2 border-black rounded-[24px] bg-[#FAFAFA]">
          <View className="mx-2">
          <TouchableOpacity
            onPress={() => router.push("/root/chat/chat-screen")}
          >
            <FontAwesome5 name="user-friends" size={24} color="black" />
          </TouchableOpacity>
          </View>
          <View className="mx-2">
            <TouchableOpacity onPress={handleNewPost}>
              <Image source={icons.pencil} className="w-7 h-7" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <SignedIn>
        <PersonalBoard userId={user!.id} />
      </SignedIn>
    </SafeAreaView>
  );
};

export default UserPersonalBoard;

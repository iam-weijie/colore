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
      <View className="flex-row justify-between mx-7 mt-3">
        <Text className="text-xl font-JakartaBold mt-4">My Personal Board</Text>
        <View className="flex-col mt-4">
          <TouchableOpacity
            onPress={() => router.push("/root/chat/chat-screen")}
          >
            <FontAwesome5 name="user-friends" size={30} color="black" />
          </TouchableOpacity>
          <View className="mt-5 mx-2">
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

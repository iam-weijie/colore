import React from "react";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { SafeAreaView, TouchableOpacity, View, Image, Text } from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import PersonalBoard from "@/components/PersonalBoard";
import { icons } from "@/constants";

const UserPersonalBoard = () => {
  const router = useRouter();
  const { user } = useUser();

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-row justify-between items-center mx-7 mt-6">
        <Text className="text-xl font-JakartaBold">
          My Personal Board
        </Text>
      </View>
      <View className="absolute top-6 right-4">
        <TouchableOpacity onPress={() => router.push("/root/chat/chat-screen")}>
          <FontAwesome5 name="user-friends" size={30} color="black" />
        </TouchableOpacity>
      </View>
      <SignedIn>
        <PersonalBoard userId={user!.id} />
      </SignedIn>
    </SafeAreaView>
  );
};

export default UserPersonalBoard;
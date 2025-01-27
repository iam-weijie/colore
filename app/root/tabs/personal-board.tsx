import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import {
  SafeAreaView,
  View,
  Image,
  TouchableOpacity,
} from "react-native";
import { icons } from "@/constants";

declare interface PersonalBoardProps {}

const PersonalBoard: React.FC<PersonalBoardProps> = () => {
 return (
  <SafeAreaView className="flex-1">
    <View className="flex-row justify-end items-center mx-7 mt-6">
      <TouchableOpacity onPress={() => router.push("/root/chat/chat-screen")}>
        <Image source={icons.chat} className="w-10 h-10"  style={{ tintColor: 'black' }} />
      </TouchableOpacity>
    </View>
  </SafeAreaView>
 )
};

export default PersonalBoard;

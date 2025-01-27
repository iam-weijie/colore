import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import {
  SafeAreaView,
  View,
  Image,
  TouchableOpacity,
} from "react-native";
import { icons } from "@/constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";

declare interface PersonalBoardProps {}

const PersonalBoard: React.FC<PersonalBoardProps> = () => {
 return (
  <SafeAreaView className="flex-1">
    <View className="flex-row justify-end items-center mx-7 mt-4">
      <TouchableOpacity onPress={() => router.push("/root/chat/chat-screen")}>
        <MaterialCommunityIcons name="message" size={32} color="black" />
      </TouchableOpacity>
    </View>
  </SafeAreaView>
 )
};

export default PersonalBoard;

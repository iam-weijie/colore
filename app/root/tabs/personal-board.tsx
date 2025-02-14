import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import {
  SafeAreaView,
  View,
  Image,
  TouchableOpacity,
} from "react-native";
import { icons } from "@/constants";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

declare interface PersonalBoardProps {}

const PersonalBoard: React.FC<PersonalBoardProps> = () => {
 return (
  <SafeAreaView className="flex-1">
    <View className="flex-col justify-end items-end mx-7 mt-6">
      <TouchableOpacity onPress={() => router.push("/root/chat/chat-screen")}>
        <Image source={icons.chat} className="w-10 h-10"  style={{ tintColor: 'black' }} />
      </TouchableOpacity>
      <View className="mt-4">
        <TouchableOpacity onPress={() => router.push("/root/friends/friend-screen")}>
          <FontAwesome5 name="user-friends" size={30} color="black"/>
        </TouchableOpacity>
      </View>
    </View>
  </SafeAreaView>
 )
};

export default PersonalBoard;

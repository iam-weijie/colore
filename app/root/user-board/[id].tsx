import { SafeAreaView, View, TouchableOpacity, Text, Image } from "react-native";
import PersonalBoard from "@/components/PersonalBoard";
import { AntDesign } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { icons } from "@/constants";
import { router } from "expo-router";
import { fetchAPI } from "@/lib/fetch";
import React from "react";
import { LinearGradient } from 'expo-linear-gradient';

const UserPersonalBoard = () => {
  const { id, username, boardId } = useLocalSearchParams();
  
  const handleNewPost = () => { 
    router.push({
      pathname: "/root/new-post",
      params: { 
        recipient_id: id,
        username: username,
        source: 'board'
      }
    });
  };

console.log("info pass to user profile", id, username, boardId)


  return (
    <View className="flex-1 pt-16 bg-[#FAFAFA]">
       <LinearGradient
            colors={["#FAFAFA", "#FAFAFA"]}  // Soft pink, blue, and purple
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            className="absolute w-full h-full inset-0 z-0"
          />
      
      <View className="flex-row justify-between items-center mx-7 mt-6 relative overflow-hidden">
     
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <AntDesign name="caretleft" size={18} />
        </TouchableOpacity>

        <Text className="text-xl font-JakartaBold">
          {username}
        </Text>

        <TouchableOpacity className="opacity-0" onPress={() => {}}>
          <Image source={icons.pencil} className="w-7 h-7" />
        </TouchableOpacity>
      </View>
      <PersonalBoard userId={id as string} boardId={boardId} />
    </View>
  );
};

export default UserPersonalBoard;

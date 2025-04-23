import UserProfile from "@/components/UserProfile";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { View } from "react-native";

const Profile = () => {
  const { id } = useLocalSearchParams();

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      {id && <UserProfile userId={id as string} />}
    </View>
  );
};

export default Profile;

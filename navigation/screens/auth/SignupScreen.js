import React from "react";
import { ScrollView, Text, View } from "react-native";

const SignupScreen = () => {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white ">
        <View className="relative w-full h-[150px]">
          <Text className="text-2xl text-black font-semibold absolute bottom-5 left-5">
            Create Your Account
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignupScreen;

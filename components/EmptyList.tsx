import React from "react";
import { Image, View, Text } from "react-native";
import Animated, { BounceIn, FadeInDown } from "react-native-reanimated";
import { characters, characterMood } from "@/constants";

interface EmptyListViewProps {
  scale?: number;
  message: string;
  character?: keyof typeof characterMood;
  mood?: number;
  subMessage?: string; // Optional second line for stronger tone
}

const EmptyListView: React.FC<EmptyListViewProps> = ({
  scale = 1,
  character = "bob",
  mood = 0,
  message,
  subMessage,
}) => {
  const selectedCharacter = characterMood[character]?.[mood] ?? null;

  return (
    <View className="flex-1 bg-red-500 flex-col items-center justify-center gap-6 px-8">
      {selectedCharacter && (
        <Animated.Image
          entering={FadeInDown.duration(500)}
          source={selectedCharacter}
          style={{
            width: 81 * scale,
            height: 81 * scale,
            resizeMode: "contain",
          }}
        />
      )}
      <Animated.Text entering={FadeInDown.duration(800)} className="text-center text-[14px] font-Jakarta text-gray-700">
        {message}
      </Animated.Text>
      {subMessage && (
        <Text className="text-center text-[12px] font-Jakarta text-gray-400 mt-[-8px]">
          {subMessage}
        </Text>
      )}
    </View>
  );
};

export default EmptyListView;

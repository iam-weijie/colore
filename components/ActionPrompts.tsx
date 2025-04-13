import React, { useState, useEffect, useRef, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {Image, Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import Animated, { useSharedValue, withSpring, useAnimatedStyle, BounceIn, FadeIn, FadeOut, withTiming } from "react-native-reanimated";
import { generateRandomPrompt } from "@/lib/prompts";
import { Prompt, ActionPromptsProps } from "@/types/type";
import { SafeAreaView } from 'react-native-safe-area-context';


const ActionPrompts: React.FC<ActionPromptsProps> = ({ action, handleAction }) => {
  const [randomPrompt, setRandomPrompt] = useState<Prompt | null>(null);


  if (!randomPrompt) {
    return  // Optional: Add a loading state while randomPrompt is null
  }

  return (
  <View
      className="
      absolute 
      flex-5
      p-6 
      bg-[#FAFAFA]
      h-[100%] 
      overflow-hidden"
    >
      <TouchableOpacity
      className="
      flex-1
      flex 
      flex-col 
      items-center 
      justify-start"
      hitSlop={3}
      onPress={handleAction}>
      <View>
        <Image
          source={randomPrompt.source}
          className="w-20 h-20 my-2"
          resizeMode="contain"
        />
      </View>

        <Text className="text-lg font-JakartaSemiBold my-2">{randomPrompt.title}</Text>
        <Text className="text-[14px] max-w-[85%]">{randomPrompt.body}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ActionPrompts;


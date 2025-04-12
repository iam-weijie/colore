import React, { useState, useEffect, useRef, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {Image, Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import Animated, { useSharedValue, withSpring, useAnimatedStyle, BounceIn, FadeIn, FadeOut, withTiming } from "react-native-reanimated";
import { generateRandomPrompt } from "@/lib/prompts";
import { Prompt, ActionPromptsProps } from "@/types/type";
import { SafeAreaView } from 'react-native-safe-area-context';


const ActionPrompts: React.FC<ActionPromptsProps> = ({ friendName, action, handleAction }) => {
  const [randomPrompt, setRandomPrompt] = useState<Prompt | null>(null);
  const [visible, setVisible] = useState<boolean>(false)

  // Initialize shared value for the Y translation
  const translateY = useSharedValue(200);  // Start off-screen
  const modalOpacity = useSharedValue(0);

  useEffect(() => {

    if (action.name != "none") {

    setVisible(true)
    const prompt = generateRandomPrompt(action.name, friendName);
    setRandomPrompt(prompt)

    // Spring animation to slide in
    translateY.value = withSpring(0, { damping: 15, stiffness: 85, mass: 1 });  // Slide in to 0 with spring effect

  
      const timeout = setTimeout(() => {
        translateY.value = withSpring(200, { damping: 15, stiffness: 85, mass: 1 });  // Slide out to off-screen
        setVisible(false)
      }, action.name == "tips" ? 9000 : 5000);  
  
      // Cleanup timeout on unmount
      return () => clearTimeout(timeout);
    }
  }, [action, friendName]);  // Dependency array ensures useEffect runs when either action or friendName changes

  useEffect(() => {
if (!visible) {
  modalOpacity.value = withTiming(0, {
    duration: 200
  })
} else {
  modalOpacity.value = withTiming(0.2, {
    duration: 200
  })
}
  }, [visible])

  useFocusEffect(
    useCallback(() => {
      return () => {
        setVisible(false); // Set visible to false when navigating away
      };
    }, [])
  );
    // Create animated style using the shared value
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateY: translateY.value }],
      };
      
    });

    const animatedOpacity = useAnimatedStyle(() => {
      return {
        opacity: modalOpacity.value
      } 
    })

    const handleClose = () => {
      setVisible(false)
      
    }

  if (!randomPrompt) {
    return  // Optional: Add a loading state while randomPrompt is null
  }

  return (

      <Modal transparent visible={visible} onRequestClose={handleClose}>
        {/* Background Overlay */}
        <Pressable className="flex-1 " onPress={handleClose}>
          <Animated.View
            style={[animatedOpacity, {backgroundColor: "black"}]}
            className="flex-1 absolute top-0 left-0 right-0 bottom-0"
          />
        </Pressable>
    <Animated.View
      style={[
        animatedStyle,]}
      className="
      absolute 
      p-6 
      bg-[#FAFAFA]
      rounded-[48px] 
      shadow-xs
      bottom-5  
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
    </Animated.View>
    </Modal>
  );
};

export default ActionPrompts;


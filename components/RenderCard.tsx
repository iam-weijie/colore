import React, { useEffect } from "react";
import {
  Image,
  Text,
  View,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import CustomButton from "./CustomButton"; // Assuming this is your button component
import { Prompt } from "@/types/type"; // Update path to your types
import { LinearGradient } from 'expo-linear-gradient';

// Sample image URLs (replace with your actual image paths)
const PLUS_ICON = 'https://cdn-icons-png.flaticon.com/512/2997/2997933.png';

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

export const RenderPromptCard = ({
  item,
  userId,
  promptContent,
  updatePromptContent,
  handlePromptSubmit,
}: {
  item: Prompt;
  userId: string;
  promptContent: string;
  updatePromptContent: (text: string) => void;
  handlePromptSubmit: (item: Prompt) => void;
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateY.value = withSpring(0, { damping: 12 });
    scale.value = withSequence(
      withTiming(1.03, { duration: 300 }),
      withSpring(1, { damping: 10 })
    );
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Animated.View
        className="rounded-[64px] py-12 px-8 justify-between"
        style={[
          animatedCardStyle,
          {
            backgroundColor: "white",
            width: screenWidth * 0.85,
            minHeight: screenHeight * 0.56,
          },
        ]}
      >

        {/* Header */}
        <View className="items-center justify-center mb-5 mt-2 px-4">
          <Text className="text-tray-400 text-[12px] font-JakartaMedium">
            {item.theme.toUpperCase()}
          </Text>
          <Text className="text-[28px] font-JakartaSemiBold text-center text-black mt-1">
            {item.cue}...
          </Text>
        </View>

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={70}
          style={{ flex: 1 }}
          pointerEvents="box-none"
        >
          <View className="px-2">
            <TextInput
              className="font-Jakarta text-[16px] text-black px-4 py-3 rounded-[24px] bg-tray-50"
              placeholder={`Complete the prompt...`}
              placeholderTextColor="#999"
              value={promptContent}
              onChangeText={updatePromptContent}
              multiline
              scrollEnabled
              style={{
                paddingTop: 12,
                paddingBottom: 12,
                minHeight: 100,
                maxHeight: 250,
                textAlignVertical: "top",
              }}
            />
          </View>
        </KeyboardAvoidingView>

        {/* Button */}
        <View className="w-full flex-row items-center justify-center">
          <CustomButton
            fontSize="lg"
            title="Submit"
            padding={4}
            disabled={promptContent.length === 0}
            onPress={() => handlePromptSubmit(item)}
          />
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};


export const RenderCreateCard = ({
  item,
  handleOptionSubmit,
}: {
  item: any;
  handleOptionSubmit: () => void;
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withSpring(0, { 
      damping: 10,  // Balanced bounce
      stiffness: 120,
      mass: 0.8
    });
    scale.value = withSequence(
      withTiming(0.98, { duration: 100 }), // Tiny initial squeeze
      withSpring(1.02, { // Subtle overshoot
        damping: 8,
        stiffness: 150
      }),
      withSpring(1, { // Settle
        damping: 10,
        stiffness: 100
      })
    );
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Animated.View
        className="flex-1 items-center justify-center my-4 rounded-[64px] overflow-hidden"
        style={[
          animatedCardStyle,
          { 
            backgroundColor: "rgba(255,255,255,1)",
            width: screenWidth * 0.85
          }
        ]}
      >
        {/* Rest of your component remains unchanged */}
        {/* Card Content */}
        <View className="w-[80%] flex-col items-center justify-center z-10">
          {/* Icon */}
          <LinearGradient
            colors={["#FBB1F5", "#93c5fd"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-full p-1 w-[96px] h-[96px] mr-4 justify-center items-center mb-6"
          >
            <View className="w-full h-full bg-white/10 rounded-full justify-center items-center">
              <Image
                source={item.icon}
                className="w-12 h-12"
                style={{ tintColor: "#FAFAFA" }}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>

          {/* Text Content */}
          <Text className="text-black text-[12px]  font-JakartaMedium tracking-widest mb-1">
            {item.label.toUpperCase()}
          </Text>
          <Text className="text-black text-[28px] text-center font-JakartaSemiBold mt-2 mb-8 leading-tight">
            {item.caption}
          </Text>

          {/* Button */}
          <CustomButton
            fontSize="lg"
            title="Create"
            padding={4}
            onPress={() => {
              handleOptionSubmit();
            }}
            disabled={false}
          />
        </View>

        {/* Floating Particles */}
        <View className="absolute top-4 right-6 w-3 h-3 bg-white/40 rounded-full" />
        <View className="absolute bottom-8 left-8 w-2 h-2 bg-white/30 rounded-full" />
        <View className="absolute top-16 left-12 w-4 h-4 bg-white/20 rounded-full" />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

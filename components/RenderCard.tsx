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
  const scale = useSharedValue(0.8);

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
      { scale: scale.value }
    ],
  }));

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} onPressIn={Keyboard.dismiss}>
      <Animated.View
        className="flex-1 flex-column items-center justify-center mt-4 mb-8 py-8 rounded-[48px]"
        style={[
          animatedCardStyle,
          { backgroundColor: "white", width: screenWidth * 0.85 }
        ]}
      >
        <View className="w-[85%] flex-1 mx-auto flex-col items-center justify-center">
          <Text className="my-1 text-[14px] font-JakartaBold text-[#CCC]">
            {item.theme}
          </Text>
          <Text className="text-[24px] text-center font-JakartaBold text-[#000]">
            {item.cue}...
          </Text>
        </View>

        <KeyboardAvoidingView behavior="padding" className="flex-1 my-6 flex w-full">
          <View className="mt-2">
            <TextInput
              className="text-[16px] text-[#000] p-5 rounded-[24px] font-JakartaBold mx-10"
              placeholder="Type something..."
              value={promptContent}
              onChangeText={updatePromptContent}
              multiline
              scrollEnabled
              style={{
                paddingTop: 10,
                paddingBottom: 0,
                minHeight: 200,
                maxHeight: 300,
                textAlignVertical: "top",
              }}
            />
          </View>
        </KeyboardAvoidingView>

        <CustomButton
          className="my-4 w-[50%] h-16 rounded-full shadow-none bg-black"
          fontSize="lg"
          title="submit"
          padding={4}
          disabled={promptContent.length === 0}
          onPress={() => {
            handlePromptSubmit(item);
          }}
        />
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
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.8);

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
          backgroundColor: "white",
          opacity: 0.9,
          width: screenWidth * 0.85,
        }
      ]}
    >
      {/* Background Image with Gradient Overlay 
      <Image
        source={{ uri: CARD_BACKGROUND }}
        className="absolute w-full h-full"
        resizeMode="cover"
        blurRadius={2}
      />
      */}
      

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
        <Text className="text-black text-sm font-JakartaSemiBold tracking-widest mb-1">
          {item.label.toUpperCase()}
        </Text>
        <Text className="text-black text-3xl text-center font-JakartaBold mb-6 leading-tight">
          {item.caption}
        </Text>

        {/* Button */}
        <CustomButton
          className="my-4 w-[175px] h-16 rounded-full shadow-none bg-black"
          fontSize="lg"
          title="Create now"
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


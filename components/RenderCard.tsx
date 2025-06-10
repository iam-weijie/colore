import React, {
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useState,
} from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  TouchableOpacity,
  Keyboard,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import ActionSheet, {
  ActionSheetRef,
  SheetManager,
} from "react-native-actions-sheet";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import CustomButton from "./CustomButton"; // Assuming this is your button component
import { Prompt } from "@/types/type"; // Update path to your types
import { LinearGradient } from "expo-linear-gradient";
import ItemContainer from "./ItemContainer";

// Sample image URLs (replace with your actual image paths)
const PLUS_ICON = "https://cdn-icons-png.flaticon.com/512/2997/2997933.png";

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
  handlePromptSubmit: (item: Prompt, content: string) => void;
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.8);
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const [isSheetVisible, setSheetVisible] = useState(false);

  const toggleSheet = () => {
    if (isSheetVisible) {
      actionSheetRef.current?.hide();
    } else {
      actionSheetRef.current?.show();
    }
  };

  useEffect(() => {
    // toggleSheet();
    opacity.value = withTiming(1, { duration: 500 });
    translateY.value = withSpring(0, { damping: 12 });
    scale.value = withSequence(
      withTiming(1.03, { duration: 300 }),
      withSpring(1, { damping: 10 })
    );
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    flexShrink: 0,
    maxHeight: screenHeight * 0.75,
  }));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      pointerEvents="box-none"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View
          style={[
            animatedCardStyle,
            {
              backgroundColor: "white",
              opacity: 0.9,
              width: screenWidth * 0.85,
            },
          ]}
          className="mx-auto my-auto px-auto overflow-hidden bg-white self-center rounded-3xl shadow-lg"
        >
          {/* Gradient background */}
          <LinearGradient
            colors={["#FBB1F5", "#93C5FD"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              ...StyleSheet.absoluteFillObject,
              opacity: 0.2,
            }}
          />
          {/* Floating circles */}
          {/* <View className="absolute top-4 right-6 w-2 h-2 rounded-full bg-white opacity-40" />
        <View className="absolute bottom-6 left-6 w-1.5 h-1.5 rounded-full bg-white opacity-30" /> */}

          {/* Content */}
          <View className="flex-col items-center justify-center px-6 py-8">
            <Text className="text-sm text-gray-500 mb-1">{item.theme}</Text>
            <Text className="text-2xl text-black font-bold text-center mb-2">
              {item.cue}...
            </Text>

            <TextInput
              placeholder="Type something..."
              value={promptContent}
              onChangeText={updatePromptContent}
              multiline
              scrollEnabled
              className="w-full p-4 bg-white rounded-xl border border-gray-300 text-base text-black"
              style={{
                textAlignVertical: "top",
                minHeight: 120,
                maxHeight: 200,
              }}
            />

            <CustomButton
              className="my-4 w-[175px] h-16 rounded-full shadow-none bg-black"
              fontSize="lg"
              title="Create now"
              padding="0"
              onPress={() => handlePromptSubmit(item, promptContent)}
              disabled={promptContent.length === 0}
            />
            <CustomButton
              className="w-[175px] h-16 rounded-full bg-black"
              fontSize="lg"
              title={isSheetVisible ? "Open Sheet" : "Cancel"}
              padding="0"
              onPress={toggleSheet}
            />
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
      <ActionSheet ref={actionSheetRef}>
        <TouchableOpacity
          onPress={() => actionSheetRef.current?.hide()}
          style={{
            height: 500,
            width: "100%",
            backgroundColor: "blue",
          }}
        >
          <Text style={{ fontSize: 24, color: "black" }}>✕</Text>
        </TouchableOpacity>
      </ActionSheet>
    </KeyboardAvoidingView>
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
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
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
          },
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
          <Text className="text-black text-3xl text-center font-JakartaBold mb-8 leading-tight">
            {item.caption}
          </Text>

          {/* Button */}
          <CustomButton
            fontSize="lg"
            title="Create"
            padding={4}
            bgVariant="gradient5"
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

export const RenderPromptAnswerCard = ({ item }: { item: any }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    // toggleSheet();
    opacity.value = withTiming(1, { duration: 500 });
    translateY.value = withSpring(0, { damping: 12 });
    scale.value = withSequence(
      withTiming(1.03, { duration: 300 }),
      withSpring(1, { damping: 10 })
    );
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    flexShrink: 0,
    maxHeight: screenHeight * 0.75,
  }));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      pointerEvents="box-none"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View
          style={[
            animatedCardStyle,
            {
              backgroundColor: "white",
              opacity: 0.9,
              width: screenWidth * 0.85,
            },
          ]}
          className="mx-auto my-auto px-auto overflow-hidden bg-white self-center rounded-3xl shadow-lg"
        >
          {/* Gradient background */}
          <LinearGradient
            colors={["#FBB1F5", "#93C5FD"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              ...StyleSheet.absoluteFillObject,
              opacity: 0.2,
            }}
          />
          {/* Floating circles */}
          {/* <View className="absolute top-4 right-6 w-2 h-2 rounded-full bg-white opacity-40" />
        <View className="absolute bottom-6 left-6 w-1.5 h-1.5 rounded-full bg-white opacity-30" /> */}

          {/* Content */}
          <View className="flex-col items-center justify-center px-6 py-8">
            <Text className="text-sm text-gray-500 mb-1">{item.content}</Text>
            <Text className="text-2xl text-black font-bold text-center mb-2">
              {item.prompt}
            </Text>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

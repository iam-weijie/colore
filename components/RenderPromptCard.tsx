import React, { useEffect } from "react";
import {
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

const screenWidth = Dimensions.get("window").width;

const RenderPromptCard = ({
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
          padding="0"
          disabled={promptContent.length === 0}
          onPress={() => {
            handlePromptSubmit(item);
          }}
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default RenderPromptCard;

import ColorSelector from "@/components/ColorSelector";
import CustomButton from "@/components/CustomButton";
import { fetchAPI } from "@/lib/fetch";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router } from "expo-router";
import React, { useState } from "react";

import { temporaryColors } from "@/constants";
import { PostItColor } from "@/types/type";
import {
  Alert,
  Dimensions,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NewPost = () => {
  const { user } = useUser();
  const [postContent, setPostContent] = useState("");
  const [inputHeight, setInputHeight] = useState(40);
  const maxCharacters = 3000;
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
    temporaryColors[0]
  );
  const [isPosting, setIsPosting] = useState(false);

  const handleColorSelect = (color: PostItColor) => {
    setSelectedColor(color);
  };

  // need to get user's screen size to set a min height
  const screenHeight = Dimensions.get("screen").height;

  const handleContentSizeChange = (event: any) => {
    setInputHeight(event.nativeEvent.contentSize.height);
  };

  const handlePostSubmit = async () => {
    setIsPosting(true);
    const cleanedContent = postContent.trim();
    if (cleanedContent === "") {
      Alert.alert("Error", "Post content cannot be empty.");
      return;
    }
    try {
      await fetchAPI("/(api)/(posts)/newPost", {
        method: "POST",
        body: JSON.stringify({
          content: cleanedContent,
          clerkId: user!.id,
          color: selectedColor.name,
        }),
      });
      setPostContent("");
      Alert.alert("Post created.");
    } catch (error) {
      Alert.alert("Error", "An error occurred. Please try again.");
    } finally {
      setIsPosting(false);
    }
    

    router.back();
  };

  const handleChangeText = (text: string) => {
    if (text.length <= maxCharacters) {
      setPostContent(text);
    } else {
      setPostContent(text.substring(0, maxCharacters));
      Alert.alert(
        "Limit Reached",
        `You can only enter up to ${maxCharacters} characters.`
      );
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <TouchableWithoutFeedback
          onPress={() => Keyboard.dismiss()}
          onPressIn={() => Keyboard.dismiss()}
        >
          <View>
            <View className="flex flex-row justify-center items-center mt-3 mx-4">
              <View className="flex-1">
                <TouchableOpacity onPress={() => router.back()}>
                  <AntDesign name="caretleft" size={18} color="0076e3" />
                </TouchableOpacity>
              </View>
              <Text className="absolute text-xl font-JakartaSemiBold">
                New Post
              </Text>
              <CustomButton
                className="w-14 h-8 rounded-md"
                fontSize="sm"
                title="Post"
                padding="0"
                onPress={handlePostSubmit}
                disabled={!postContent || isPosting}
              />
            </View>

            <View className="mx-3">
              <TextInput
                className="font-Jakarta mx-2 my-5"
                placeholder="Type something..."
                value={postContent}
                onChangeText={handleChangeText}
                onContentSizeChange={handleContentSizeChange}
                autoFocus
                multiline
                scrollEnabled
                style={{
                  paddingTop: 10,
                  paddingBottom: 0,
                  minHeight: screenHeight * 0.2,
                  maxHeight: screenHeight * 0.45,
                  textAlignVertical: "top",
                }}
              />
              <ColorSelector
                colors={temporaryColors}
                selectedColor={selectedColor}
                onColorSelect={handleColorSelect} // Debug
                //onColorSelect={setSelectedColor}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </SignedIn>
    </SafeAreaView>
  );
};

export default NewPost;

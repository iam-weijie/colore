import { SignedIn, useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import EmojiSelector from "react-native-emoji-selector";
import { SafeAreaView } from "react-native-safe-area-context";

import ColorSelector from "@/components/ColorSelector";
import CustomButton from "@/components/CustomButton";
import { icons, temporaryColors } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { PostItColor } from "@/types/type";
import { useNavigationContext } from "@/components/NavigationContext";

const NewPost = () => {
  const { user } = useUser();
  const { content, color, emoji } = useLocalSearchParams();
  
  const [postContent, setPostContent] = useState("");
  const [inputHeight, setInputHeight] = useState(40);
  const maxCharacters = 3000;
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
    temporaryColors[Math.floor(Math.random() * 4)]
  );
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [isEmojiSelectorVisible, setIsEmojiSelectorVisible] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [fromPreview, setFromPreview] = useState(false);

  // Initialize from route params when component mounts or params change
  useEffect(() => {
    if (content) {
      setPostContent(Array.isArray(content) ? content[0] : content as string);
      setFromPreview(true);
    }
    
    if (color) {
      const colorValue = Array.isArray(color) ? color[0] : color as string;
      const savedColor = temporaryColors.find(c => c.name === colorValue);
      if (savedColor) {
        setSelectedColor(savedColor);
      }
    }
    
    if (emoji) {
      setSelectedEmoji(Array.isArray(emoji) ? emoji[0] : emoji as string);
    }
  }, [content, color, emoji]);

  // Handle back navigation
  const handleBackNavigation = () => {
    // If we came from preview, we need to go to the home tab
    if (fromPreview) {
      router.replace("/root/tabs/home");
    } else {
      router.back();
    }
  };

  const handleColorSelect = (color: PostItColor) => {
    setSelectedColor(color);
    setIsEmojiSelectorVisible(false);
  };

  // need to get user's screen size to set a min height
  const screenHeight = Dimensions.get("screen").height;

  const handleContentSizeChange = (event: any) => {
    setInputHeight(event.nativeEvent.contentSize.height);
  };

  const handlePostSubmit = async () => {
    router.push({
      pathname: "/root/preview-post",
      params: {
        id: "", 
        content: postContent, 
        color: selectedColor.name, 
        emoji: selectedEmoji
      }
    });
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

  const toggleEmojiSelector = () => {
    setIsEmojiSelectorVisible((prev) => !prev);
    // console.log(selectedEmoji);
  };

   useEffect(() => {
     if (selectedEmoji && isEmojiSelectorVisible) {
       toggleEmojiSelector();
     }
   }, [selectedEmoji]);
   

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <TouchableWithoutFeedback
          onPress={() => Keyboard.dismiss()}
          onPressIn={() => Keyboard.dismiss()}
        >
          <View className="flex-1">
            <View className="flex flex-row justify-center items-center mt-3 mx-6">
              <View className="flex-1">
                <TouchableOpacity onPress={handleBackNavigation}>
                  <AntDesign name="caretleft" size={18} color="0076e3" />
                </TouchableOpacity>
              </View>
              <Text className="absolute text-xl font-JakartaSemiBold">
                New Post
              </Text>
              <CustomButton
                className="w-14 h-10 rounded-full shadow-none"
                fontSize="sm"
                title="Next"
                style={{backgroundColor: selectedColor.hex}}
                padding="0"
                onPress={handlePostSubmit}
                disabled={!postContent || isPosting}
              />
            </View>
            <KeyboardAvoidingView behavior="padding" className="flex-1 flex w-full">
          <View className="flex h-full flex-column justify-between items-center pb-4">
            <View className="flex w-full mx-3">
              {!isEmojiSelectorVisible && (
                <TextInput
                  className="text-[16px] font-Jakarta mx-10 my-5 "
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
                    maxHeight: screenHeight * 0.5,
                    textAlignVertical: "top",
                  }}
                />
              )}
            </View>
    
            <View className=" w-full flex flex-row justify-center items-center mb-12">
              <ColorSelector
                colors={temporaryColors}
                selectedColor={selectedColor}
                onColorSelect={handleColorSelect}
                //onColorSelect={setSelectedColor}
              />

              <TouchableOpacity onPress={toggleEmojiSelector}>
                {selectedEmoji ? (
                  <Text style={{ fontSize: 35, margin: 1 }}>
                    {selectedEmoji}
                  </Text>
                ) : (
                  <Image source={icons.wink} className="w-8 h-9 m-1" />
                )}
              </TouchableOpacity>
              </View>
             
              </View>
              </KeyboardAvoidingView>

            {isEmojiSelectorVisible && (
              <View className="w-full h-screen bg-white">
                <EmojiSelector
                  onEmojiSelected={(emoji) => {
                    setSelectedEmoji(emoji);
                  }}
                />
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </SignedIn>
    </SafeAreaView>
  );
};

export default NewPost;

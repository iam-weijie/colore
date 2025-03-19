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
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import EmojiSelector from "react-native-emoji-selector";

import ColorSelector from "@/components/ColorSelector";
import CustomButton from "@/components/CustomButton";
import { icons, temporaryColors } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { PostItColor } from "@/types/type";

const EditPost = () => {
  const { user } = useUser();
  const { postId, content, color, emoji} = useLocalSearchParams()
  const [postContent, setPostContent] = useState<string>(`${content}`);
  const [inputHeight, setInputHeight] = useState(40);
  const maxCharacters = 3000;
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
    temporaryColors.find(
      (c) => c.name === color
    ) as PostItColor
  );
  const [selectedEmoji, setSelectedEmoji] = useState<string>(typeof emoji === 'string' ? emoji : '');
  const [isEmojiSelectorVisible, setIsEmojiSelectorVisible] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const statusBarHeight = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

  // Add a useEffect that only runs once on component mount
  useEffect(() => {
    // Initialize the content, color, and emoji once when component mounts
    // This ensures we don't overwrite user edits when returning from preview
    setPostContent(`${content}`);
    setSelectedColor(
      temporaryColors.find(
        (c) => c.name === color
      ) as PostItColor
    );
    setSelectedEmoji(typeof emoji === 'string' ? emoji : '');
  }, []); // Empty dependency array means this only runs once on mount

  const handleColorSelect = (color: PostItColor) => {
    setSelectedColor(color);
    setIsEmojiSelectorVisible(false);
  };

  // need to get user's screen size to set a min height
  const screenHeight = Dimensions.get("screen").height;

  const handleContentSizeChange = (event: any) => {
    setInputHeight(event.nativeEvent.contentSize.height);
  };

  const handlePostUpdate = () => {
    router.push({
      pathname: "/root/preview-post",
      params: {
        id: postId, 
        content: postContent, 
        color: selectedColor.name, 
        emoji: selectedEmoji
      }
    })
    
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
    // Dismiss keyboard first to avoid layout conflicts
    Keyboard.dismiss();
    
    // Use setTimeout to ensure keyboard is fully dismissed before toggling
    setTimeout(() => {
      setIsEmojiSelectorVisible((prev) => !prev);
    }, 100);
  };
  
  return (
    <SafeAreaView style={{ 
      flex: 1, 
      paddingTop: Platform.OS === "android" ? statusBarHeight : 0 
    }}>
      <SignedIn>
        <TouchableWithoutFeedback
          onPress={() => Keyboard.dismiss()}
          onPressIn={() => Keyboard.dismiss()}
        >
          <View className="flex-1">
            <View style={{ position: 'relative', width: '100%' }}>
              <View className="flex flex-row justify-between items-center mx-6 mt-2">
                <View style={{ width: 60, zIndex: 5, elevation: 5 }}>
                  <TouchableOpacity onPress={() => router.back()}>
                    <AntDesign name="caretleft" size={18} color="0076e3" />
                  </TouchableOpacity>
                </View>
                <View style={{ width: 60, zIndex: 5, elevation: 5, alignItems: 'flex-end' }}>
                  <CustomButton
                    className="w-14 h-10 rounded-full shadow-none"
                    fontSize="sm"
                    title="Save"
                    style={{backgroundColor: selectedColor?.hex || String(color)}}
                    padding="0"
                    onPress={handlePostUpdate}
                    disabled={!postContent || isPosting}
                  />
                </View>
              </View>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', height: '100%', zIndex: 4, elevation: 4 }}>
                <Text className="text-xl font-JakartaSemiBold mt-2">
                  Edit Post
                </Text>
              </View>
            </View>
            <KeyboardAvoidingView behavior="padding" className="flex-1 flex w-full">
              <View className="flex h-full flex-column justify-between items-center pb-4">
                <View className="flex w-full mx-3">
                  {!isEmojiSelectorVisible && (
                    <TextInput
                      className="text-[16px] font-Jakarta mx-10 my-5"
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
                        fontSize: 16,
                      }}
                    />
                  )}
                </View>
        
                <View className="w-full flex flex-row justify-center items-center mb-12">
                  <ColorSelector
                    colors={temporaryColors}
                    selectedColor={selectedColor}
                    onColorSelect={handleColorSelect}
                  />

                  <TouchableOpacity onPress={toggleEmojiSelector}>
                    {selectedEmoji ? (
                      <Text style={{ fontSize: 35, margin: 1, fontFamily: undefined }}>
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
              <View 
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'white',
                  zIndex: 999
                }}
              >
                <EmojiSelector
                  onEmojiSelected={(emoji) => {
                    setSelectedEmoji(emoji);
                    setIsEmojiSelectorVisible(false);
                  }}
                  showSearchBar={false}
                  columns={8}
                />
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </SignedIn>
    </SafeAreaView>
  );
};

export default EditPost;

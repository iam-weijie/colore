import { SignedIn, useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmojiSelector from "react-native-emoji-selector";

import ColorSelector from "@/components/ColorSelector";
import CustomButton from "@/components/CustomButton";
import { icons, temporaryColors } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { PostItColor } from "@/types/type";

const NewPersonalPost = () => {
  const { user } = useUser();
  const { recipient_id, source } = useLocalSearchParams();
  const [postContent, setPostContent] = useState("");
  const [inputHeight, setInputHeight] = useState(40);
  const maxCharacters = 3000;
  const [selectedColor, setSelectedColor] = useState<PostItColor>(temporaryColors[0]);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [isEmojiSelectorVisible, setIsEmojiSelectorVisible] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const screenHeight = Dimensions.get("screen").height;

  useEffect(() => {
    if (!recipient_id) {
      console.error("No recipient_id provided");
      Alert.alert("Error", "No recipient specified");
      router.back();
    }
  }, [recipient_id]);

  const handleContentSizeChange = (event: any) => {
    setInputHeight(event.nativeEvent.contentSize.height);
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

  const handleColorSelect = (color: PostItColor) => {
    setSelectedColor(color);
    setIsEmojiSelectorVisible(false);
  };

  const toggleEmojiSelector = () => {
    setIsEmojiSelectorVisible((prev) => !prev);
  };

  useEffect(() => {
    if (selectedEmoji) {
      toggleEmojiSelector();
    }
  }, [selectedEmoji]);

  const handlePostSubmit = async () => {
    setIsPosting(true);
    const cleanedContent = postContent.trim();
    
    if (cleanedContent === "") {
      Alert.alert("Error", "Post content cannot be empty.");
      setIsPosting(false);
      return;
    }

    try {
      const response = await fetchAPI("/api/posts/newPersonalPost", {
        method: "POST",
        body: JSON.stringify({
          content: cleanedContent,
          clerkId: user!.id,
          recipientId: recipient_id,
          color: selectedColor.name,
          emoji: selectedEmoji,
          post_type: 'personal'
        }),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setPostContent("");
      setSelectedEmoji(null);
      Alert.alert("Success", "Personal note created!", [
        {
          text: "OK",
          onPress: () => {
            if (source === 'profile') {
              router.back();
            } else {
              router.push({
                pathname: "/root/tabs/personal-board",
                params: { id: recipient_id }
              });
            }
          }
        }
      ]);
    } catch (error) {
      console.error("Failed to create personal post:", error);
      Alert.alert("Error", "Failed to create personal note. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <SignedIn>
        <TouchableWithoutFeedback
          onPress={() => Keyboard.dismiss()}
          onPressIn={() => Keyboard.dismiss()}
        >
          <View className="flex-1">
            {/* Header */}
            <View className="flex-row justify-between items-center px-6 py-3">
              <TouchableOpacity onPress={() => router.back()}>
                <AntDesign name="caretleft" size={18} color="0076e3" />
              </TouchableOpacity>
              <Text className="text-xl font-JakartaSemiBold">Leave a Note</Text>
              <CustomButton
                className="w-14 h-8 rounded-md"
                fontSize="sm"
                title="Post"
                padding="0"
                onPress={handlePostSubmit}
                disabled={!postContent || isPosting}
              />
            </View>

            {/* Main Content */}
            <View className="flex-1 px-6">
              {!isEmojiSelectorVisible && (
                <View className="flex-1">
                  <TextInput
                    className="flex-1 font-Jakarta py-4"
                    placeholder="Type something..."
                    value={postContent}
                    onChangeText={handleChangeText}
                    onContentSizeChange={handleContentSizeChange}
                    autoFocus
                    multiline
                    scrollEnabled
                    style={{
                      textAlignVertical: "top",
                    }}
                  />
                </View>
              )}

              {/* Bottom Bar */}
              <View className="flex-row items-center justify-between py-4">
                <View className="flex-row">
                  <ColorSelector
                    colors={temporaryColors}
                    selectedColor={selectedColor}
                    onColorSelect={handleColorSelect}
                  />
                  
                  <TouchableOpacity 
                    onPress={toggleEmojiSelector}
                    className="ml-4"
                  >
                    {selectedEmoji ? (
                      <Text style={{ fontSize: 35 }}>{selectedEmoji}</Text>
                    ) : (
                      <Image source={icons.wink} className="w-8 h-8" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Emoji Selector */}
            {isEmojiSelectorVisible && (
              <View className="absolute bottom-0 left-0 right-0 h-96 bg-white">
                <EmojiSelector
                  onEmojiSelected={(emoji) => {
                    setSelectedEmoji(emoji);
                  }}
                  showSearchBar={false}
                />
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </SignedIn>
    </SafeAreaView>
  );
};

export default NewPersonalPost;
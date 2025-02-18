import React, { useState, useEffect } from 'react';
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import { 
  Alert, 
  Dimensions, 
  Image, 
  Keyboard, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  TouchableWithoutFeedback, 
  View 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmojiSelector from "react-native-emoji-selector";
import AntDesign from "@expo/vector-icons/AntDesign";

import ColorSelector from "@/components/ColorSelector";
import { icons, temporaryColors } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { PostItColor } from "@/types/type";

const NewPersonalPost = () => {
  const { user } = useUser();
  const { recipient_id } = useLocalSearchParams();
  const [postContent, setPostContent] = useState("");
  const [selectedColor, setSelectedColor] = useState<PostItColor>(temporaryColors[0]);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [isEmojiSelectorVisible, setIsEmojiSelectorVisible] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const screenHeight = Dimensions.get("screen").height;
  const maxCharacters = 3000;

  const handleColorSelect = (color: PostItColor) => {
    setSelectedColor(color);
    setIsEmojiSelectorVisible(false);
  };

  const handlePostSubmit = async () => {
    setIsPosting(true);
    const cleanedContent = postContent.trim();
    
    if (cleanedContent === "") {
      Alert.alert("Error", "Post content cannot be empty.");
      setIsPosting(false);
      return;
    }

    try {
      await fetchAPI("/api/posts/newPersonalPost", {
        method: "POST",
        body: JSON.stringify({
          content: cleanedContent,
          clerkId: user!.id,
          receipientId: recipient_id,
          color: selectedColor.name,
          emoji: selectedEmoji,
        }),
      });
      
      Alert.alert("Success", "Post created successfully!");
      router.back();
    } catch (error) {
      console.error('Failed to create personal post:', error);
      Alert.alert("Error", "Failed to create post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleChangeText = (text: string) => {
    if (text.length <= maxCharacters) {
      setPostContent(text);
    } else {
      setPostContent(text.substring(0, maxCharacters));
      Alert.alert("Limit Reached", `You can only enter up to ${maxCharacters} characters.`);
    }
  };

  const toggleEmojiSelector = () => {
    setIsEmojiSelectorVisible(prev => !prev);
  };

  useEffect(() => {
    if (selectedEmoji) {
      toggleEmojiSelector();
    }
  }, [selectedEmoji]);

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-white">
            <View className="flex flex-row justify-between items-center mt-3 mx-6">
              <TouchableOpacity onPress={() => router.back()}>
                <AntDesign name="caretleft" size={18} />
              </TouchableOpacity>
              <Text className="text-xl font-JakartaSemiBold">New Personal Post</Text>
              <TouchableOpacity
                onPress={handlePostSubmit}
                disabled={!postContent || isPosting}
                className={`px-4 py-2 rounded-md ${(!postContent || isPosting) ? 'bg-gray-300' : 'bg-black'}`}
              >
                <Text className="text-white font-JakartaSemiBold">
                  {isPosting ? "Posting..." : "Post"}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mx-3 mt-6">
              {!isEmojiSelectorVisible && (
                <TextInput
                  className="font-Jakarta mx-10 my-5"
                  placeholder="Write something..."
                  value={postContent}
                  onChangeText={handleChangeText}
                  autoFocus
                  multiline
                  scrollEnabled
                  style={{
                    minHeight: screenHeight * 0.2,
                    maxHeight: screenHeight * 0.45,
                    textAlignVertical: "top",
                  }}
                />
              )}

              <View className="mt-4">
                <ColorSelector
                  colors={temporaryColors}
                  selectedColor={selectedColor}
                  onColorSelect={handleColorSelect}
                />
              </View>

              <TouchableOpacity onPress={toggleEmojiSelector} className="mt-4">
                {selectedEmoji ? (
                  <Text style={{ fontSize: 35 }}>{selectedEmoji}</Text>
                ) : (
                  <Image source={icons.wink} className="w-8 h-9" />
                )}
              </TouchableOpacity>
            </View>

            {isEmojiSelectorVisible && (
              <View className="absolute bottom-0 left-0 right-0 h-[50%] bg-white">
                <EmojiSelector
                  onEmojiSelected={(emoji) => setSelectedEmoji(emoji)}
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
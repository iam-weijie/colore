import { SignedIn, useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
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
import EmojiSelector from "@/components/EmojiSelector";
import RecentEmojiPopup from "@/components/RecentEmojiPopup";
import { useRecentEmojis } from "@/hooks/useRecentEmojis";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import { icons, temporaryColors } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { PostItColor } from "@/types/type";
import { useAlert } from '@/notifications/AlertContext';
import ColorPickerSlider from "@/components/ColorPickerSlider";
import * as Haptics from "expo-haptics";
import { useHaptics } from "@/hooks/useHaptics";


const EditPost = () => {
  const { user } = useUser();
  const { postId, content, color, emoji} = useLocalSearchParams()
  const [postContent, setPostContent] = useState<string>(`${content}`);
  const [inputHeight, setInputHeight] = useState(40);
  const maxCharacters = 3000;
  const { showAlert } = useAlert();
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
    temporaryColors.find(
      (c) => c.id === color
    ) as PostItColor
  );
  const [selectedEmoji, setSelectedEmoji] = useState<string>(emoji);
  const [isEmojiSelectorVisible, setIsEmojiSelectorVisible] = useState(false);
  const [showRecentPopup, setShowRecentPopup] = useState(false);
  const [triggerPosition, setTriggerPosition] = useState({ x: 0, y: 0 });
  const [isPosting, setIsPosting] = useState(false);

  const emojiButtonRef = useRef<any>(null);
  const { recentEmojis, addRecentEmoji } = useRecentEmojis();

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
        emoji: selectedEmoji,
        username: ""
      }
    })

  };


  const handleChangeText = (text: string) => {
    if (text.length <= maxCharacters) {
      setPostContent(text);
    } else {
      setPostContent(text.substring(0, maxCharacters));
      showAlert({
        title: 'Limit Reached',
        message: `You can only enter up to ${maxCharacters} characters.`,
        type: 'ERROR',
        status: 'error',
      });
    }
  };

  const toggleEmojiSelector = () => {
    setIsEmojiSelectorVisible((prev) => !prev);
    // console.log(selectedEmoji);
  };

  const handleEmojiLongPress = () => {
    // Don't require recent emojis for testing - comment this line when testing is complete
    // if (recentEmojis.length === 0) return; // Don't show if no recent emojis

    // Don't show emoji selector when long pressing
    if (isEmojiSelectorVisible) {
      setIsEmojiSelectorVisible(false);
    }

    if (emojiButtonRef.current) {
      emojiButtonRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setTriggerPosition({
          x: pageX + width / 2,  // Center horizontally
          y: pageY + height + 5  // Bottom of button with small offset
        });
        
        // Show popup - haptic feedback is now handled in the popup component
        setShowRecentPopup(true);
      });
    }
  };

  const handleRecentEmojiSelect = async (emoji: string) => {
    // Add to recent emojis (moves to front)
    await addRecentEmoji(emoji);

    // Set as selected emoji
    setSelectedEmoji(emoji);
    
    // The popup handles its own animation now, 
    // but we still need to update the state after animation completes
    setTimeout(() => {
      setShowRecentPopup(false);
    }, 350); // Wait for animation to complete
  };

  const handleEmojiSelect = async (emoji: string) => {
    // Add to recent emojis
    await addRecentEmoji(emoji);

    // Set as selected emoji
    setSelectedEmoji(emoji);
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
                <TouchableOpacity onPress={() => router.back()}>
                  <AntDesign name="caretleft" size={18} color="0076e3" />
                </TouchableOpacity>
              </View>
              <Text className="absolute text-xl font-JakartaSemiBold">
                Editing
              </Text>
              <CustomButton
                className="w-14 h-10 rounded-full shadow-none"
                fontSize="sm"
                title="next"
                style={{backgroundColor: selectedColor.hex}}
                padding={4}
                onPress={handlePostUpdate}
                disabled={!postContent || isPosting}
              />
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
                  }}
                />
              )}
            </View>

            <View className=" w-full flex flex-row justify-center items-center mb-12">
              <ColorPickerSlider
                colors={temporaryColors}
                selectedColor={selectedColor}
                onColorSelect={handleColorSelect}
              />

              <TouchableOpacity
                ref={emojiButtonRef}
                onPress={toggleEmojiSelector}
                onLongPress={handleEmojiLongPress}
                delayLongPress={300}
              >
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
              <EmojiSelector
                showInModal={true}
                isVisible={true}
                onClose={() => setIsEmojiSelectorVisible(false)}
                onEmojiSelected={handleEmojiSelect}
                selectedEmoji={selectedEmoji}
                mode="both"
              />
            )}

            {/* Recent Emoji Popup */}
            <RecentEmojiPopup
              visible={showRecentPopup}
              recentEmojis={recentEmojis}
              onEmojiSelect={handleRecentEmojiSelect}
              onClose={() => setShowRecentPopup(false)}
              triggerPosition={triggerPosition}
            />
          </View>
        </TouchableWithoutFeedback>
      </SignedIn>
    </SafeAreaView>
  );
};

export default EditPost;

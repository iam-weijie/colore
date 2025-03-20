import { SignedIn, useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router } from "expo-router";
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
  BackHandler,
  Animated,
} from "react-native";
import EmojiSelector from "react-native-emoji-selector";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import ColorSelector from "@/components/ColorSelector";
import CustomButton from "@/components/CustomButton";
import { icons, temporaryColors } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { Post, PostItColor } from "@/types/type";
import PostModal from "@/components/PostModal";

const NewPost = () => {
  const { user } = useUser();
  const [postContent, setPostContent] = useState("");
  const [inputHeight, setInputHeight] = useState(40);
  const maxCharacters = 3000;
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
    temporaryColors[Math.floor(Math.random() * 4)]
  );
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [isEmojiSelectorVisible, setIsEmojiSelectorVisible] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Create a preview post for the PostModal
  const previewPost: Post = {
    id: 0,
    clerk_id: user?.id || "",
    firstname: user?.firstName || "",
    username: user?.username || "",
    content: postContent,
    created_at: new Date().toISOString(),
    city: "",
    state: "",
    country: "",
    like_count: 0,
    report_count: 0,
    unread_comments: 0,
    recipient_user_id: "",
    pinned: false,
    color: selectedColor.name,
    emoji: selectedEmoji || "",
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
    // Reset opacity to fully visible
    fadeAnim.setValue(1);
    setShowPreview(true);
    // Don't clear content here so it persists when returning from preview
  };

  const handlePreviewClose = () => {
    // Start the fade out animation first
    Animated.timing(
      fadeAnim,
      {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }
    ).start(() => {
      // Then hide the preview after animation completes
      setShowPreview(false);
      // Reset opacity for next time
      fadeAnim.setValue(1);
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

  const handleFinalPostSubmit = async () => {
    console.log("Creating standard post");
    setIsPosting(true);

    try {
      console.log("Sending standard post request");
      await fetchAPI("/api/posts/newPost", {
        method: "POST",
        body: JSON.stringify({
          content: postContent,
          clerkId: user!.id,
          color: selectedColor.name,
          emoji: selectedEmoji,
        }),
      });

      console.log("Standard post created, navigating to home");
      // Start the fade out animation
      Animated.timing(
        fadeAnim,
        {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }
      ).start(() => {
        // Complete navigation after animation
        setShowPreview(false);
        router.replace(`/root/tabs/home`);
      });

      setTimeout(() => {
        Alert.alert("Success", "Post created.");
      }, 500);
    } catch (error) {
      console.log("Standard post error: ", error);
      Alert.alert("Error", "An error occurred. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  useEffect(() => {
    if (selectedEmoji && isEmojiSelectorVisible) {
      toggleEmojiSelector();
    }
  }, [selectedEmoji]);
   
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (showPreview) {
          handlePreviewClose();
          return true;
        }
        router.back();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [showPreview])
  );

  return (
    <SafeAreaView className="flex-1">
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
                    title="Post"
                    style={{backgroundColor: selectedColor.hex}}
                    padding="0"
                    onPress={handlePostSubmit}
                    disabled={!postContent || isPosting}
                  />
                </View>
              </View>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', height: '100%', zIndex: 4, elevation: 4 }}>
                <Text className="text-xl font-JakartaSemiBold mt-2">
                  New Post
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
                  }}
                />
              )}
            </View>
    
            <View className=" w-full flex flex-row justify-center items-center mb-12">
              <ColorSelector
                colors={temporaryColors}
                selectedColor={selectedColor}
                onColorSelect={handleColorSelect}
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

      {showPreview && (
        <Animated.View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          backgroundColor: 'transparent',
          zIndex: 100,
          opacity: fadeAnim
        }}>
          <PostModal
            isVisible={showPreview}
            selectedPost={previewPost}
            handleCloseModal={handlePreviewClose}
            isPreview={true}
            header={
              <View className="absolute top-0 left-0 w-full mt-10 pt-7 px-6 z-50">
                <View style={{ position: 'relative', width: '100%' }}>
                  <View className="flex flex-row justify-between items-center">
                    <View style={{ width: 60 }}>
                      <TouchableOpacity
                        onPress={handlePreviewClose}
                        className="mr-2"
                      >
                        <AntDesign name="caretleft" size={18} color={"black"} />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={{ width: 60, alignItems: 'flex-end' }}>
                      <CustomButton
                        className="w-14 h-10 rounded-full shadow-none"
                        fontSize="sm"
                        title="Post"
                        style={{backgroundColor: "black"}}
                        padding="0"
                        onPress={handleFinalPostSubmit}
                        disabled={isPosting}
                      />
                    </View>
                  </View>
                  
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Text className="font-JakartaSemiBold text-[#0] text-xl">
                      Preview
                    </Text>
                  </View>
                </View>
              </View>
            }
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

export default NewPost;

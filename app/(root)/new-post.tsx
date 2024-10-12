import CustomButton from "@/components/CustomButton";
import { fetchAPI } from "@/lib/fetch";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NewPost = () => {
  const { user } = useUser();
  const [postContent, setPostContent] = useState("");
  const [inputHeight, setInputHeight] = useState(40);
  const maxCharacters = 3000;

  // need to get user's screen size to set a min height
  const screenHeight = Dimensions.get("screen").height;

  const handleContentSizeChange = (event: any) => {
    setInputHeight(event.nativeEvent.contentSize.height);
  };

  const handlePostSubmit = async () => {
    const cleanedContent = postContent.trim();
    if (cleanedContent === "") {
      Alert.alert("Error", "Post content cannot be empty.");
      return;
    }

    await fetchAPI("/(api)/(posts)/newPost", {
      method: "POST",
      body: JSON.stringify({
        content: cleanedContent,
        clerkId: user!.id,
      }),
    });

    setPostContent("");
    Alert.alert("Success", "Post created successfully.");

    router.replace("/(root)/home");
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
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>  
          <View>
            <View className="flex-row justify-between">
              <View className="ml-2 mr-2 mt-4">
                <TouchableOpacity
                  onPress={() => router.push("/(root)/(tabs)/home")}
                >
                  <AntDesign name="caretleft" size={18} color="0076e3" />
                </TouchableOpacity>
              </View>
              <Text className="flex-1 text-xl font-JakartaSemiBold mt-3">
                Create a New Post
              </Text>
              <CustomButton
                className="mr-2 mt-2 w-16 h-9 rounded"
                fontSize="sm"
                title="Post"
                padding="0"
                onPress={handlePostSubmit}
              />
            </View>
            <View className="mx-3">
              <TextInput
                className="font-Jakarta mx-2 my-2"
                placeholder="Enter post content"
                value={postContent}
                onChangeText={handleChangeText}
                multiline
                scrollEnabled
                onContentSizeChange={handleContentSizeChange}
                style={{
                  paddingTop: 10,
                  paddingBottom: 0,
                  minHeight: screenHeight * 0.2,
                  maxHeight: screenHeight * 0.45,
                  textAlignVertical: "top",
                }}
              />
            </View>
          </View>     
        </TouchableWithoutFeedback>
      </SignedIn>
    </SafeAreaView>
  );
};

export default NewPost;

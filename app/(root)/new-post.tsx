import { fetchAPI } from "@/lib/fetch";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, TextInput, View, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "@/components/CustomButton";

const NewPost = () => {
  const { user } = useUser();
  const [postContent, setPostContent] = useState("");
  const [inputHeight, setInputHeight] = useState(40);
  const maxCharacters = 3000;

  // need to get user's screen size to set a min height
  const minHeight = Dimensions.get("screen").height * 0.2; 

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
      setPostContent(text.substring(0, maxCharacters))
      Alert.alert("Limit Reached", `You can only enter up to ${maxCharacters} characters.`);

    }
  };

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <View className="flex-row justify-between">
        <Text className="text-xl font-JakartaSemiBold m-3">
          Create a New Post
        </Text>
          <CustomButton
            className="mr-2 mt-2 w-16 h-10 rounded" 
            fontSize="sm"
            title="Post" 
            onPress={handlePostSubmit} 
          />
        </View>
        <View className="mx-3 max-h-[50%]">
          <TextInput
            className="border mx-3 px-2 my-5 rounded-lg border-slate-400 font-Jakarta mx-2 my-2"
            placeholder="Enter post content"
            value={postContent}
            onChangeText={handleChangeText}
            multiline
            scrollEnabled
            onContentSizeChange={handleContentSizeChange}
            style={{ 
              paddingTop: 10, 
              paddingBottom: 0, 
              minHeight: minHeight,
              textAlignVertical: "top",
            }}
          />
        </View>
      </SignedIn>
    </SafeAreaView>
  );
};

export default NewPost;

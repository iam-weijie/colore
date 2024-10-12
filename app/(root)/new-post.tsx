import { fetchAPI } from "@/lib/fetch";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, TextInput, View, Button, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NewPost = () => {
  const { user } = useUser();
  const [postContent, setPostContent] = useState("");
  const [inputHeight, setInputHeight] = useState(40);

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

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <Text className="text-xl font-JakartaSemiBold m-3">
          Create a New Post
        </Text>
        <View className="border mx-3 my-5 rounded-lg border-slate-400 h-50 max-h-[70%]">
          <TextInput
            className="font-Jakarta mx-2 my-2"
            placeholder="Enter post content"
            value={postContent}
            onChangeText={setPostContent}
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
        <Button 
          className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full absolute right-4 bottom-4"
          title="Submit Post" 
          onPress={handlePostSubmit} 
        />
      </SignedIn>
    </SafeAreaView>
  );
};

export default NewPost;

import CustomButton from "@/components/CustomButton";
import { fetchAPI } from "@/lib/fetch";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NewPost = () => {
  const { user } = useUser();
  const [postContent, setPostContent] = useState("");

  const handlePostSubmit = async () => {
    const cleanedContent = postContent.trim();
    console.log(user!.id);
    // additional sanitization needed

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
        <Text className="text-lg font-JakartaSemiBold m-3">
          Create a New Post
        </Text>
        <TextInput
          placeholder="Enter post content"
          value={postContent}
          onChangeText={setPostContent}
          multiline
        />
        <CustomButton title="Submit Post" onPress={handlePostSubmit} />
      </SignedIn>
    </SafeAreaView>
  );
};

export default NewPost;

import CustomButton from "@/components/CustomButton";
import { fetchAPI } from "@/lib/fetch";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


const NewPost = () => {
  const { user } = useUser();
  const [postContent, setPostContent] = useState("");
  const [inputHeight, setInputHeight] = useState(40);
  const [postColor, setPostColor] = useState("yellow");
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

        
    try {
      const repsonse = await fetchAPI("/(api)/(posts)/newPost", {
        method: "POST",
        body: JSON.stringify({
          content: cleanedContent,
          clerkId: user!.id,
          color: postColor,
      }),
    });

    // await fetchAPI("/(api)/(posts)/newPost", {
    //   method: "POST",
    //   body: JSON.stringify({
    //     content: cleanedContent,
    //     clerkId: user!.id,
    //   }),
    // });

    setPostContent("");
    Alert.alert("Post published.");

    router.back();

  }
  catch (error){
    console.error('Error creating post:', error);
    Alert.alert("Error", "Failed to create post. Please try again.");
  }
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


  const ColorCircle = ({ color, onPress, isSelected }) => (
    <TouchableOpacity 
      onPress={onPress}
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: color,
        marginHorizontal: 5,
        borderWidth: isSelected ? 2 : 0,
        borderColor: "black",
      }}
    />

  );


  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <TouchableWithoutFeedback
          onPress={() => Keyboard.dismiss()}
          onPressIn={() => Keyboard.dismiss()}
        >
          <View>
            <View className="flex flex-row justify-center items-center mt-3 mx-4">
              <View className="flex-1">
                <TouchableOpacity onPress={() => router.back()}>
                  <AntDesign name="caretleft" size={18} color="0076e3" />
                </TouchableOpacity>
              </View>
              <Text className="absolute text-xl font-JakartaSemiBold">
                New Post
              </Text>
              <CustomButton
                className="w-14 h-8 rounded-md"
                fontSize="sm"
                title="Post"
                padding="0"
                onPress={handlePostSubmit}
                disabled={!postContent}
              />
            </View>
            <View className="flex-row justify-end items-center mx-1 mb-1">
              <Text className="font-JakartaSemiBold mr-2">Color:</Text>
              <ColorCircle 
                color="yellow" 
                onPress={() => setPostColor("yellow")}
                isSelected={postColor === "yellow"}
              />
              <ColorCircle 
                color="blue" 
                onPress={() => setPostColor("blue")}
                isSelected={postColor === "blue"}
              />
              <ColorCircle 
                color="red" 
                onPress={() => setPostColor("red")}
                isSelected={postColor === "red"}
            />
           </View>
            <View className="mx-3">
              <TextInput
                className="font-Jakarta mx-2 my-5"
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


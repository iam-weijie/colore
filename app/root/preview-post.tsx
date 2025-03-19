import CustomButton from "@/components/CustomButton";
import PostModal from "@/components/PostModal";
import { temporaryColors } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { Post, PostItColor } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PreviewPost = () => {
  const { user } = useUser();
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const { id, content, color, emoji, personal, recipientId } =
    useLocalSearchParams();
  const [isPosting, setIsPosting] = useState(false);
  const [postColor, setPostColor] = useState<PostItColor>(
    temporaryColors.find((c) => c.name === color) as PostItColor
  );

  // Create a default "empty" post object
  const defaultPost: Post = {
    id: parseInt((id as string) || "0"), // Convert string id to number
    clerk_id: "",
    firstname: "",
    username: "",
    content: (content as string) || "",
    created_at: "",
    city: "",
    state: "",
    country: "",
    like_count: 0,
    report_count: 0,
    unread_comments: 0,
    recipient_user_id: "",
    pinned: false,
    color: (color as string) || "", // Ensure color is treated as string
    emoji: emoji as string,
  };

  const [post, setPost] = useState<Post>(defaultPost);

  useEffect(() => {
    console.log("Preview post mounted with params:", {
      id,
      content,
      color,
      emoji,
      personal,
      recipientId
    });
    setPost(defaultPost);
  }, [id, content, color]); // Re-run when params change

  const handleCloseModal = () => {
    setIsVisible(false);
    if (id) {
      // For edit mode, navigate back to edit-post with the same parameters
      router.back();
    } else {
      // For new post mode, navigate back to new-post with the content preserved
      router.back();
    }
  };

  const handleSubmitPost = async () => {
    console.log("handleSubmitPost started");
    setIsPosting(true);

    if (id) {
      console.log("Editing existing post: ", id);
      const cleanedContent = content as string;

      if (!cleanedContent || cleanedContent.trim() === "") {
        console.log("Content is empty");
        setIsPosting(false); // Ensure state is reset
        Alert.alert("Error", "Post content cannot be empty.");
        return;
      }

      try {
        console.log("Sending update request");
        await fetchAPI("/api/posts/updatePost", {
          method: "PATCH",
          body: JSON.stringify({
            content: cleanedContent,
            postId: id,
            color: postColor.name,
            emoji: emoji,
          }),
        });

        console.log("Update successful, navigating to profile");
        router.replace(`/root/tabs/profile`);
        setTimeout(() => {
          Alert.alert("Success", "Post updated successfully.");
        }, 500);
      } catch (error) {
        console.log("Update error: ", error);
        Alert.alert("Error", "An error occurred. Please try again.");
      } finally {
        setIsPosting(false);
      }
    } else if (personal === "true") {
      console.log("Creating personal post to recipient: ", recipientId);
      const cleanedContent = content as string;
      if (!cleanedContent || cleanedContent.trim() === "") {
        console.log("Content is empty");
        setIsPosting(false); // Ensure state is reset
        Alert.alert("Error", "Post content cannot be empty.");
        return;
      }
      try {
        console.log("Sending personal post request");
        const response = await fetchAPI("/api/posts/newPersonalPost", {
          method: "POST",
          body: JSON.stringify({
            content: cleanedContent,
            clerkId: user!.id,
            recipientId: recipientId,
            color: postColor.name,
            emoji: emoji,
          }),
        });

        console.log("Personal post created, navigating to personal board");
        router.replace(`/root/tabs/personal-board`);

        setTimeout(() => {
          Alert.alert("Success", "Post created.");
        }, 500);
      } catch (error) {
        console.log("Personal post error: ", error);
        Alert.alert("Error", "An error occurred. Please try again.");
      } finally {
        setIsPosting(false);
      }
    } else {
      console.log("Creating standard post");
      const cleanedContent = content as string;
      if (!cleanedContent || cleanedContent.trim() === "") {
        console.log("Content is empty");
        setIsPosting(false); // Ensure state is reset
        Alert.alert("Error", "Post content cannot be empty.");
        return;
      }
      try {
        console.log("Sending standard post request");
        await fetchAPI("/api/posts/newPost", {
          method: "POST",
          body: JSON.stringify({
            content: cleanedContent,
            clerkId: user!.id,
            color: postColor.name,
            emoji: emoji,
          }),
        });

        console.log("Standard post created, navigating to home");
        router.replace(`/root/tabs/home`);

        setTimeout(() => {
          Alert.alert("Success", "Post created.");
        }, 500);
      } catch (error) {
        console.log("Standard post error: ", error);
        Alert.alert("Error", "An error occurred. Please try again.");
      } finally {
        setIsPosting(false);
      }
    }
  };
  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1">
        <PostModal
          isVisible={isVisible}
          selectedPost={post} // Always a valid Post object
          handleCloseModal={handleCloseModal}
          isPreview={true}
          header={
            <View className="absolute top-0 left-0 w-full mt-10 pt-7 px-6 z-50">
              <View style={{ position: 'relative', width: '100%' }}>
                <View className="flex flex-row justify-between items-center">
                  <View style={{ width: 60 }}>
                    <TouchableOpacity
                      onPress={() => router.back()}
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
                      onPress={handleSubmitPost}
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
      </View>
    </SafeAreaView>
  );
};

export default PreviewPost;

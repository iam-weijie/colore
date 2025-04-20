import CustomButton from "@/components/CustomButton";
import PostModal from "@/components/PostModal";
import { temporaryColors } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { Post, PostItColor } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAlert } from '@/notifications/AlertContext';
import * as Haptics from 'expo-haptics';
import { useGlobalContext } from "../globalcontext";
 

const PreviewPost = () => {
  const { user } = useUser();
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const { showAlert } = useAlert();
  const { setDraftPost, draftPost } = useGlobalContext();
  const [isPosting, setIsPosting] = useState(false);


  const handleCloseModal = () => {
    setIsVisible(false);
    router.back(); // Single back; assumed this goes to NewPost
  };

  const handleSubmitPost = async () => {
    if (!draftPost || draftPost.content.trim() === "") {
      showAlert({
        title: "Error",
        message: "Post cannot be empty.",
        type: "ERROR",
        status: "error",
      });
      return;
    }

    setIsPosting(true);

    const isUpdate = Boolean(draftPost.id);
    const isPersonal = Boolean(draftPost.recipient_user_id);
    const isPrompt = Boolean(draftPost.prompt_id);

    try {
      if (isUpdate) {
        await fetchAPI("/api/posts/updatePost", {
          method: "PATCH",
          body: JSON.stringify({
            postId: draftPost.id,
            content: draftPost.content,
            color: draftPost.color,
            emoji: draftPost.emoji,
          }),
        });

        showAlert({
          title: "Success",
          message: "Post updated successfully.",
          type: "UPDATE",
          status: "success",
        });
        router.back();
      } else {
        const body = {
          content: draftPost.content,
          clerkId: user!.id,
          color: draftPost.color,
          emoji: draftPost.emoji,
          ...(isPersonal && {
            recipientId: draftPost.recipient_user_id,
            boardId: draftPost.board_id,
            postType: "personal",
          }),
          ...(isPrompt && {
            expiration: draftPost.expires_at,
            promptId: draftPost.prompt_id,
          }),
        };

        await fetchAPI("/api/posts/newPost", {
          method: "POST",
          body: JSON.stringify(body),
        });

        showAlert({
          title: "Success",
          message: "Post created.",
          type: "POST",
          status: "success",
        });

        // Go back twice: out of preview and then out of new-post
        router.back(); // slight delay for safe stack unwinding
      }
    } catch (error) {
      console.error("Error submitting post:", error);
      showAlert({
        title: "Error",
        message: "An error occurred. Please try again.",
        type: "ERROR",
        status: "error",
      });
    } finally {
      setDraftPost(null);
      setIsPosting(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1">
        <PostModal
          isVisible={isVisible}
          selectedPosts={[draftPost]} // Always a valid Post object
          handleCloseModal={handleCloseModal}
          isPreview={true}
          header={
          
              <View className="flex-1 absolute flex items-center w-full bottom-[15%]">
            <CustomButton
              className="w-[50%] h-16 rounded-full shadow-none bg-black"
              fontSize="lg"
              title="submit"
              padding="0"
              onPress={handleSubmitPost}
              //disabled={!postContent || isPosting}
            />
               <TouchableOpacity
                  onPress={handleCloseModal}
                  className="mt-4"
                >
                  <Text 
                  className="text-white font-JakartaBold text-[16px]"
                  style={{
                    borderBottomWidth: 2,
                    borderBottomColor: "#fff"
                  }}>
                    Go back
                  </Text>
                </TouchableOpacity>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default PreviewPost;

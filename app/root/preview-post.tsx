import CustomButton from "@/components/CustomButton";
import PostModal from "@/components/PostModal";
import { temporaryColors } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { Post, PostItColor } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Platform, Text, TouchableOpacity, View } from "react-native";
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
    router.push("/root/new-post");
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
        router.push("/root/tabs/home");
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

        router.push("/root/tabs/home");
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
      <View className="flex-1">
        <PostModal
          isVisible={isVisible}
          selectedPosts={[draftPost]} // Always a valid Post object
          handleCloseModal={handleCloseModal}
          isPreview={true}
          header={
              <View 
                className="flex-1 items-center w-full" 
                style={{
                  position: 'absolute',
                  bottom: Platform.OS === 'android' ? 80 : '10%',
                  left: 0,
                  right: 0,
                  zIndex: 999
                }}
              >
                <CustomButton
                  className="w-[50%] h-16 rounded-full shadow-none bg-black"
                  fontSize="lg"
                  title="submit"
                  padding="0"
                  onPress={handleSubmitPost}
                  activeOpacity={0.7}
                />
                <TouchableOpacity
                  onPress={handleCloseModal}
                  className="mt-4 p-3"
                  activeOpacity={0.7}
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
  );
};

export default PreviewPost;

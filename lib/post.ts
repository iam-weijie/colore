import * as Linking from "expo-linking";
import { router } from "expo-router";
import { Post } from "@/types/type";
import { fetchAPI } from "./fetch";
import { useAuth, useUser } from "@clerk/clerk-expo";
import * as FileSystem from "expo-file-system";
import {
    Alert,
    Dimensions,
    Image,
    ImageSourcePropType,
    Platform,
    ScrollView,
    Share,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
  } from "react-native";




  
export const handleReportPress = () => {
    Linking.openURL("mailto:support@colore.ca");
  };

export const handleEditing = (post: Post) => {
  
      setTimeout(() => {
        router.push({
          pathname: "/root/new-post",
          params: {
            postId: post.id,
            content: post.content,
            color: post.color,
            emoji: post.emoji,
          },
        });
      }, 750);
    };
  
export const handleReadComments = async (post: Post, userId: string) => {
    
    if (post.clerk_id === userId) {
      try {
        console.log("Patching comments")
        
        await fetchAPI(`/api/posts/updateUnreadComments`, {
          method: "PATCH",
          body: JSON.stringify({
            clerkId: userId,
            postId: post?.id,
            postClerkId: post.clerk_id,
          }),
        });
      } catch (error) {
        console.error("Failed to update unread comments:", error);
      }
    }
  };

export const handlePin = async (post: Post, isPinned: boolean, userId: string) => {
      try {
        await fetchAPI(`/api/posts/updatePinnedPost`, {
          method: "PATCH",
          body: JSON.stringify({
            userId: userId,
            postId: post?.id,
            pinnedStatus: !isPinned,
          }),
        });
      } catch (error) {
        console.error("Failed to update handlepin message:", error);
      }
    };
  
 export const handleShare = async (imageUri: string | null, post: Post) => {
    if (!imageUri) {
      console.warn("No image to share. Please capture first.");
      return;
    }

    try {
      let imageToShare = imageUri;
      if (Platform.OS === "ios") {
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        imageToShare = `data:image/png;base64,${base64}`;
      }

      const result = await Share.share({
        message: `${post.content.trim()} \n\nDownload Coloré here:https://apps.apple.com/ca/app/coloré/id6738930845`,
        url: imageToShare, // Share the captured image (uri or base64)
      });

      if (result.action === Share.sharedAction) {
        console.log("Shared successfully");
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

export const handleSavePost = async (postId: number, isSaved: boolean, userId: string) => {
      try {
        await fetchAPI(`/api/users/updateUserSavedPosts`, {
          method: "PATCH",
          body: JSON.stringify({
            clerkId: userId,
            postId: postId,
            isSaved: isSaved,
          }),
        });
      } catch (error) {
        console.error("Failed to update unread message:", error);
      } 
    };
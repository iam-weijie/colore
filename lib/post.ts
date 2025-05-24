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
import { useGlobalContext } from "@/app/globalcontext";
import * as Haptics from 'expo-haptics';
import { useAlert } from "@/notifications/AlertContext";




  
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

export   const distanceBetweenPosts = (
        x_ref: number,
        y_ref: number,
        x: number,
        y: number
      ) => {
        const x_diff = x_ref - x;
        const y_diff = y_ref - y;
        const distance = Math.sqrt(x_diff ** 2 + y_diff ** 2);
        return distance;
      };

export const fetchCountryEmoji = async (countryName: string) => {
  
  try {
    const response = await fetch(`https://restcountries.com/v3.1/name/${countryName}`);
    const data = await response.json();

    if (!response.ok || !data || data.length === 0) {
      //setError("Country not found.");
      return;
    }

    const countryCode = data[0]?.cca2 || ""; // ISO 3166-1 alpha-2 country code
    const flagEmoji = countryCode?.toUpperCase().split("").map((char: string) => String.fromCodePoint(127397 + char.charCodeAt(0))).join("") || "📍";

    return flagEmoji
  } catch (err) {
   console.log("Failed fetching country emoji", err)
  }

};

export const isOnlyEmoji = (message: string) => {
  // Remove any whitespace
  const trimmed = message.trim();

  // Regex to match emojis (including compound ones like flags and skin tones)
  const emojiRegex = /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|\p{Emoji_Presentation}|\p{Emoji_Modifier_Base}|\p{Emoji_Modifier})+$/u;

  // Check that the string is not only digits
  const numberOnlyRegex = /^\d+$/;

  return emojiRegex.test(trimmed) && !numberOnlyRegex.test(trimmed);
}


export const handleSubmitPost = async (userId: string, draftPost: Post) => {

   console.log("came here.", draftPost)
  if (!draftPost || draftPost.content.trim() === "") {
    console.log("ended up in an error")
    return;
  }


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
      router.back();
    } else {
      const body = {
        content: draftPost.content,
        clerkId: userId,
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
      // Go back twice: out of preview and then out of new-post
      router.back(); // slight delay for safe stack unwinding
    }
  } catch (error) {
    console.error("Error submitting post:", error);
  } finally {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
};

/*
export const handleSubmitPost = async (userId: string, draftPost: Post) => {
  const { showAlert } = useAlert();

  console.log("came here.", draftPost)
 if (!draftPost || draftPost.content.trim() === "") {
   console.log("ended up in an error")
   showAlert({
     title: "Error",
     message: "Post cannot be empty.",
     type: "ERROR",
     status: "error",
   });
   return;
 }


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
       clerkId: userId,
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
   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
 }
};
*/
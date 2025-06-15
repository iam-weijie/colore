import * as Linking from "expo-linking";
import { router } from "expo-router";
import { Post } from "@/types/type";
import { fetchAPI } from "@/lib/fetch";
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
import * as Haptics from "expo-haptics";
import { addDays } from "date-fns";
import { encryptText } from "@/lib/encryption";

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
    
    if (post.user_id === userId) {
      try {
        console.log("Patching comments")

        await fetchAPI(`/api/posts/updateUnreadComments`, {
          method: "PATCH",
          body: JSON.stringify({
            clerkId: userId,
            postId: post?.id,
            postUserId: post.user_id,
          }),
        });
      } catch (error) {
        console.error("Failed to update unread comments:", error);
      }
    }
  };

export const handlePin = async (
  post: Post,
  isPinned: boolean,
  userId: string
) => {
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
      message: `${(post?.content ?? "")?.trim()} \n\nDownload Coloré here:https://apps.apple.com/ca/app/coloré/id6738930845`,
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

  if (isSaved) {
     try {
        await fetchAPI(`/api/posts/deleteSavedPost`, {
          method: "PATCH",
          body: JSON.stringify({
            userId: userId,
            postId: postId,
          }),
        });
      } catch (error) {
        console.error("Failed to update unread message:", error);
      } 
    }
  else {
    try {
        await fetchAPI(`/api/posts/newSavedPost`, {
          method: "POST",
          body: JSON.stringify({
            userId: userId,
            postId: postId,
          }),
        });
      } catch (error) {
        console.error("Failed to update unread message:", error);
      } 
  }

  }


export const distanceBetweenPosts = (
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
    const response = await fetch(
      `https://restcountries.com/v3.1/name/${countryName}`
    );
    const data = await response.json();

    if (!response.ok || !data || data.length === 0) {
      //setError("Country not found.");
      return;
    }

    const countryCode = data[0]?.cca2 || ""; // ISO 3166-1 alpha-2 country code
    const flagEmoji =
      countryCode
        ?.toUpperCase()
        .split("")
        .map((char: string) =>
          String.fromCodePoint(127397 + char.charCodeAt(0))
        )
        .join("") || "📍";

    return flagEmoji;
  } catch (err) {
    console.log("Failed fetching country emoji", err);
  }
};

export const isOnlyEmoji = (message: string) => {
  // Remove any whitespace
  const trimmed = (message ?? "").trim();

  // Regex to match emojis (including compound ones like flags and skin tones)
  const emojiRegex =
    /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|\p{Emoji_Presentation}|\p{Emoji_Modifier_Base}|\p{Emoji_Modifier})+$/u;

  // Check that the string is not only digits
  const numberOnlyRegex = /^\d+$/;

  return emojiRegex.test(trimmed) && !numberOnlyRegex.test(trimmed);
};

export const handleSubmitPost = async (
  userId: string,
  draftPost: Post,
  encryptionKey?: string | null
) => {
  console.log("[DEBUG] Starting handleSubmitPost");
  console.log("[DEBUG] Encryption key available:", Boolean(encryptionKey));
  
  if (!draftPost || draftPost.content.trim() === "") {
    console.log("ended up in an error");
    const status = "error";
    return status;
  }

  const stripMarkdown = (text: string) => {
    return text
      .replace(/^###\s/gm, "")
      .replace(/^##\s/gm, "")
      .replace(/^#\s/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/<u>(.*?)<\/u>/g, "$1")
      .replace(/^1\.\s/gm, "")
      .replace(/^-\s?/gm, "");
  };

  let cleanContent = stripMarkdown(draftPost.content);

  const isUpdate = Boolean(draftPost.id);
  const isPersonal = Boolean(draftPost.recipient_user_id);
  const isPrompt = Boolean(draftPost.prompt_id);
  const shouldEncrypt = isPersonal;

  console.log("[DEBUG] Post details:", {
    isUpdate,
    isPersonal,
    shouldEncrypt,
    recipientId: draftPost.recipient_user_id,
    content: cleanContent.substring(0, 20) + (cleanContent.length > 20 ? "..." : "")
  });

  if (shouldEncrypt && encryptionKey) {
    console.log("[DEBUG] Encrypting content...");
    const originalContent = cleanContent;
    cleanContent = encryptText(cleanContent, encryptionKey);
    console.log("[DEBUG] Content before encryption:", originalContent.substring(0, 20) + (originalContent.length > 20 ? "..." : ""));
    console.log("[DEBUG] Content after encryption:", cleanContent.substring(0, 20) + (cleanContent.length > 20 ? "..." : ""));
  } else if (shouldEncrypt) {
    console.warn("[DEBUG] Should encrypt but no encryption key available!");
  }

  try {
    if (isUpdate) {
      // For updates, we need to handle encryption differently based on whether it's a personal post
      const updateContent = shouldEncrypt && encryptionKey 
        ? encryptText(draftPost.content, encryptionKey) 
        : draftPost.content;
      
      console.log("[DEBUG] Update post - content encrypted:", shouldEncrypt && Boolean(encryptionKey));
        
      await fetchAPI("/api/posts/updatePost", {
        method: "PATCH",
        body: JSON.stringify({
          postId: draftPost.id,
          content: updateContent,
          color: draftPost.color,
          emoji: draftPost.emoji,
          formatting: shouldEncrypt && encryptionKey && draftPost.formatting
            ? encryptText(JSON.stringify(draftPost.formatting), encryptionKey)
            : draftPost.formatting,
        }),
      });
      router.back();
      return "success";
    } else {
      console.log("[DEBUG] Creating new post - preparing body");
      const body = {
        content: cleanContent,
        clerkId: userId,
        color: draftPost.color,
        emoji: draftPost.emoji,
        ...(isPersonal && {
          recipientId: draftPost.recipient_user_id,
          boardId: draftPost.board_id,
          postType: "personal",
        }),
        ...(isPrompt && {
          promptId: draftPost.prompt_id,
        }),
        expires_at: draftPost.expires_at
          ? draftPost.expires_at
          : addDays(new Date(), 365).toISOString(),
        available_at: draftPost.available_at
          ? draftPost.available_at
          : new Date().toISOString(),
        static_emoji: draftPost.static_emoji,
        reply_to: draftPost.reply_to,
        formatting: draftPost.formatting,
      };

      console.log("[DEBUG] Sending post to API with content:", 
        body.content.substring(0, 20) + (body.content.length > 20 ? "..." : ""));

      const response = await fetchAPI("/api/posts/newPost", {
        method: "POST",
        body: JSON.stringify(body),
      });

      // Check if the post was created successfully
      if (response && response.data) {
        console.log("[DEBUG] Post created successfully:", response.data.id);
        router.back(); // slight delay for safe stack unwinding
        return "success";
      } else {
        console.error("[DEBUG] Failed to create post:", response);
        return "error";
      }
    }
  } catch (error) {
    console.error("Error submitting post:", error);
    return "error";
  } finally {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
};

export const fetchLikeStatus = async (post: Post, userId: string) => {
  try {
    if (!post || !post.id) {
      console.error("Invalid post object:", post);
      return { isLiked: false, likeCount: 0 };
    }
    
    const response = await fetchAPI(
      `/api/posts/updateLikeCount?postId=${post.id}&userId=${userId}`,
      { method: "GET" }
    );
    
    if (response.error) {
      console.error("Error fetching like status:", response.error);
      return { isLiked: false, likeCount: 0 };
    }

    const isLiked: boolean = response.data?.liked;
    const likeCount: number = response.data?.likeCount;

    return { isLiked: isLiked ?? false, likeCount: likeCount ?? 0 };
  } catch (error) {
    console.error("Failed to fetch like status:", error);
    return { isLiked: false, likeCount: 0 };
  }
};

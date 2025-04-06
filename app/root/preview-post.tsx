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
 

const PreviewPost = () => {
  const { user } = useUser();
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const { showAlert } = useAlert();
  const { id, content, color, emoji, personal, recipientId, username } =
    useLocalSearchParams();
  const [isPosting, setIsPosting] = useState(false);
  const [postColor, setPostColor] = useState<PostItColor>(
    temporaryColors.find((c) => c.name === color) as PostItColor
  );

  // Create a default "empty" post object
  const defaultPost: Post = {
    id: parseInt(id as string) || 0, // Parse it as a number with fallback to 0
    clerk_id: "",
    firstname: "",
    username: username,
    content: (content as string) || "",
    created_at: "",
    city: "",
    state: "",
    country: "",
    like_count: 0,
    report_count: 0,
    unread_comments: 0,
    color: (color as string) || "", 
    emoji: (emoji as string) || "", // Ensure emoji is string type
    recipient_user_id: "",
    pinned: false
  };

  const [post, setPost] = useState<Post>(defaultPost);

  useEffect(() => {
    setPost(defaultPost);
  }, [id, content, color]); // Re-run when params change

  const handleCloseModal = () => {
    setIsVisible(false);
    // Navigate back to new-post with current params to preserve input state
    // Using replace instead of push to avoid adding a new entry to the navigation stack

    if (id) {
      router.back()
    } else if (personal === "true") {
      router.replace({
        pathname: "/root/new-personal-post",
        params: {
          content: content,
          color: color,
          emoji: emoji,
          recipient_id: recipientId,
          username: username
        }
      });

    }
    else {
      router.replace({
        pathname: "/root/tabs/new-post",
        params: {
          content: content,
          color: color,
          emoji: emoji
        }
      });
    }
  
  };

  const handleSubmitPost = async () => {
    setIsPosting(true);

    if (id) {
      const cleanedContent = content;

      if (cleanedContent === "") {
        setIsPosting(false); // Ensure state is reset
        showAlert({
          title: 'Error',
          message: `Post cannot be empty.`,
          type: 'ERROR',
          status: 'error',
        });
        return;
      }

      try {
        await fetchAPI("/api/posts/updatePost", {
          method: "PATCH",
          body: JSON.stringify({
            content: cleanedContent,
            postId: id,
            color: postColor.name,
            emoji: emoji,
          }),
        });

        router.replace(`/root/tabs/profile`);
        setTimeout(() => {
          showAlert({
            title: 'Success',
            message: `Post updated successfully.`,
            type: 'UPDATE',
            status: 'success',
          });
        }, 500);
      } catch (error) {
        console.log(error);
        showAlert({
          title: 'Error',
          message: `An error occurred. Please try again.`,
          type: 'ERROR',
          status: 'error',
        });
      } finally {
        setIsPosting(false);
      }
    } else if (personal === "true") {
      const cleanedContent = content;
      if (cleanedContent === "") {
        showAlert({
          title: 'Error',
          message: `Post cannot be empty.`,
          type: 'ERROR',
          status: 'error',
        });
        return;
      }
      try {
        await fetchAPI("/api/posts/newPersonalPost", {
          method: "POST",
          body: JSON.stringify({
            content: cleanedContent,
            clerkId: user!.id,
            recipientId: recipientId,
            color: postColor.name,
            emoji: emoji,
          }),
        });

        router.back()
        router.back()

        

        setTimeout(() => {
          showAlert({
            title: 'Success',
            message: `Post created.`,
            type: 'POST',
            status: 'success',
          });
        }, 500);
      } catch (error) {
        showAlert({
          title: 'Error',
          message: `An error occurred. Please try again.`,
          type: 'ERROR',
          status: 'error',
        });
      } finally {
        setIsPosting(false);
      }
    } else {
      setIsPosting(true);
      const cleanedContent = content;
      if (cleanedContent === "") {
        showAlert({
          title: 'Error',
          message: `Post cannot be empty.`,
          type: 'ERROR',
          status: 'error',
        });
        return;
      }
      try {
        await fetchAPI("/api/posts/newPost", {
          method: "POST",
          body: JSON.stringify({
            content: content,
            clerkId: user!.id,
            color: postColor.name,
            emoji: emoji,
          }),
        });

        router.replace(`/root/tabs/new-post`);

        setTimeout(() => {
          showAlert({
            title: 'Success',
            message: `Post created.`,
            type: 'POST',
            status: 'success',
          });
        }, 500);
      } catch (error) {
        showAlert({
          title: 'Error',
          message: `An error occurred. Please try again.`,
          type: 'ERROR',
          status: 'error',
        });
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
            <View className="absolute top-0 left-0 w-full flex flex-row items-center justify-center mt-10 pt-7 px-6">
              <View className="flex-1">
                <TouchableOpacity
                  onPress={handleCloseModal}
                  className="mr-2"
                >
                  <AntDesign name="caretleft" size={18} color={"white"} />
                </TouchableOpacity>
              </View>
              <View className="absolute top-9 ">
                <Text className="font-JakartaSemiBold text-[#ffffff] text-xl ">
                  Preview
                </Text>
              </View>
              <View>
                <CustomButton
                  className="w-14 h-10 rounded-full shadow-none"
                  fontSize="sm"
                  title="Post"
                  style={{ backgroundColor: "black" }}
                  padding="0"
                  onPress={handleSubmitPost}
                  disabled={false}
                />
              </View>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default PreviewPost;

import { useEncryptionContext } from "@/app/contexts/EncryptionContext";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects"; // Import sound hook
import { icons } from "@/constants/index";
import { allColors } from "@/constants/colors";
import {
  handleReportPress,
  handleReadComments,
  handleEditing,
  handlePin,
  handleShare,
  handleSavePost as libHandleSavePost,
  fetchLikeStatus,
} from "@/lib/post";
import { fetchAPI } from "@/lib/fetch";
import { convertToLocal, formatDateTruncatedMonth } from "@/lib/utils";
import {
  Post,
  PostItColor,
  PostContainerProps,
  UserNicknamePair,
  PostWithPosition,
  Format,
} from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
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
  Keyboard,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import ReactNativeModal from "react-native-modal";
import ModalSheet from "@/components/Modal";
import Animated, {
  BounceIn,
  BounceInDown,
  Easing,
  FadeIn,
  FadeInUp,
  FadeOutDown,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { captureRef } from "react-native-view-shot";
import DropdownMenu from "./DropdownMenu";
import { useAlert } from "@/notifications/AlertContext";
import InteractionButton from "./InteractionButton";
import CarrouselIndicator from "./CarrouselIndicator";
import EmojiExplosionModal from "./EmojiExplosiveModal";
import PostScreen from "@/app/root/post/[id]";
import ItemContainer from "./ItemContainer";
import EmojiBackground from "./EmojiBackground";
import { RichText } from "./RichTextInput";
import { decryptText } from "@/lib/encryption"; // Import decryptText
import { useStacks } from "@/app/contexts/StacksContext";
import { useDraftPost } from "@/app/contexts/DraftPostContext";
import { useDevice } from "@/app/contexts/DeviceContext";
import { useSettingsContext } from "@/app/contexts/SettingsContext";
import { useUserDataContext } from "@/app/contexts/UserDataContext";

const { width, height } = Dimensions.get("window");

const AnimatedView = Animated.createAnimatedComponent(View);

const PostContainer: React.FC<PostContainerProps> = React.memo(({
  selectedPosts,
  handleCloseModal,
  handleUpdate,
  invertedColors = false,
  infiniteScroll = false,
  staticEmoji = false,
  isPreview = false,
  isShowCasing = false,
  header,
  scrollToLoad,
  seeComments = false,
}) => {
  const { stacks, setStacks } = useStacks();
  const { draftPost } = useDraftPost();
  const { isIpad } = useDevice();
  const { soundEffectsEnabled } = useSettingsContext();
  const { encryptionKey } = useEncryptionContext();
  const { playSoundEffect } = useSoundEffects(); // Get sound function
  const { user } = useUser();
  const { 
    savedPosts, 
    getNicknameFor, 
    addSavedPost, 
    removeSavedPost 
  } = useUserDataContext();
  const [nickname, setNickname] = useState<string>("");
  const [currentPost, setCurrentPost] = useState<Post>();
  const [currentPostIndex, setCurrentPostIndex] = useState<number>(0);
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");
  const [isEmojiStatic, setIsEmojiStatic] = useState<boolean>(staticEmoji);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isLoadingLike, setIsLoadingLike] = useState<boolean>(false);
  const [showEmojiModal, setShowEmojiModal] = useState<boolean>(false);
  const [selectedBoard, setSelectedBoard] = useState<any | null>(null);
  const { showAlert } = useAlert();
  const router = useRouter();
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const viewRef = useRef<View>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Memoize the posts array to prevent unnecessary re-renders
  const post = useMemo(() => selectedPosts, [selectedPosts]);

  // Check if post is saved
  useEffect(() => {
    if (currentPost && savedPosts) {
      setIsSaved(savedPosts.includes(currentPost.id.toString()));
    }
  }, [currentPost, savedPosts]);

  useEffect(() => {
    if (post.length) {
      setPosts(post);
      setCurrentPost(post[currentPostIndex]);
      setIsEmojiStatic(post[currentPostIndex]?.static_emoji ?? false);
      
      // Debug logging
      console.log("[DEBUG] PostContainer - Received posts:", post.length);
      if (post.length > 0) {
        console.log("[DEBUG] PostContainer - First post content:", post[0].content.substring(0, 30));
        console.log("[DEBUG] PostContainer - First post is personal:", Boolean(post[0].recipient_user_id));
      }
    }
  }, [post, currentPostIndex]);

  useEffect(() => {
    setCurrentPost(post[currentPostIndex]);
    console.log("[DEBUG] PostContainer - Current post updated:", currentPostIndex);
    if (post[currentPostIndex]) {
      console.log("[DEBUG] PostContainer - Current post content:", post[currentPostIndex].content.substring(0, 30));
      
      // Try to decrypt the content directly if it's a personal post
      const currentPostData = post[currentPostIndex];
      if (currentPostData && 
          currentPostData.recipient_user_id && 
          encryptionKey && 
          currentPostData.content.startsWith('U2FsdGVkX1')) {
        try {
          const decryptedContent = decryptText(currentPostData.content, encryptionKey);
          console.log("[DEBUG] PostContainer - Directly decrypted content:", decryptedContent);
          
          // Update the current post with decrypted content
          setCurrentPost({
            ...currentPostData,
            content: decryptedContent
          });
        } catch (error) {
          console.error("[DEBUG] PostContainer - Direct decryption failed:", error);
        }
      }
    }

    if (
      infiniteScroll &&
      typeof scrollToLoad === "function" &&
      currentPostIndex + 1 === posts.length - 1
    ) {
      // If last post and infiniteScroll is enabled
      scrollToLoad();
    }
  }, [currentPostIndex, encryptionKey, post, infiniteScroll, scrollToLoad, posts.length]);

  useEffect(() => {
    console.log("[PostContainer] See Comment: ", seeComments)
    if (seeComments) {
      setTimeout(() => {
        handleCommentsPress();
      }, 800);
    }
  }, [seeComments]);


  // Fetch like status when current post changes
  useEffect(() => {
    if (currentPost && user) {
      const isSaved = savedPosts.includes(String(currentPost.id));
      setIsSaved(isSaved);
      
      if (handleUpdate) {
        handleUpdate(currentPost.id, true);
      }
      
      if (handleCloseModal) {
        handleCloseModal();
      }
      
    } catch (error) {
      console.error("Error deleting post:", error);
      showAlert({
        title: "Error",
        message: "Failed to delete post. Please try again.",
        type: "ERROR",
        status: "error",
      });
    }
  }, [currentPost, user, showAlert, handleUpdate, handleCloseModal]);

      


  const handleCapture = useCallback(async () => {
    if (!viewRef.current) return;
    
    try {
      const uri = await captureRef(viewRef, {
        format: "png",
        quality: 0.8,
      });
      
      setImageUri(uri);
      
      // Handle sharing
      await Share.share({
        url: uri,
        title: "Check out this post from Colore!",
      });
      
    } catch (error) {
      console.error("Error capturing view:", error);
      showAlert({
        title: "Error",
        message: "Failed to share post. Please try again.",
        type: "ERROR",
        status: "error",
      });
    }
  }, [viewRef, showAlert]);

  const getMenuItems = useCallback((
    isOwner: boolean,
    invertedColors: boolean,
    isPreview: boolean
  ) => {
    const menuItems = [];
    
    if (!isPreview) {
      if (isOwner) {
        menuItems.push({
          icon: icons.trash,
          label: "Delete",
          onPress: handleDeletePress,
        });
      }
      
      menuItems.push({
        icon: isSaved ? icons.bookmarkFilled : icons.bookmark,
        label: isSaved ? "Unsave" : "Save",
        onPress: () => handleSavePostPress(currentPost?.id),
      });
      
      menuItems.push({
        icon: icons.share,
        label: "Share",
        onPress: handleCapture,
      });
      
      if (!isOwner) {
        menuItems.push({
          icon: icons.flag,
          label: "Report",
          onPress: () => {
            Linking.openURL("mailto:support@colore.ca");
          },
        });
      }
    }
    
    return menuItems;
  }, [isSaved, handleDeletePress, handleCapture, currentPost]);

  const handleSavePostPress = useCallback(async (postId: number | undefined) => {
    if (!postId || !user) return;
    
    try {
      // Play sound effect
      if (soundEffectsEnabled) {
        playSoundEffect(SoundType.Button);
      }
      
      // Optimistic update
      if (isSaved) {
        removeSavedPost(postId);
      } else {
        addSavedPost(postId);
      }
      
      setIsSaved(!isSaved);
      
      const response = await fetchAPI(`/api/posts/${isSaved ? "unsavePost" : "savePost"}`, {
        method: "POST",
        body: JSON.stringify({
          postId: postId,
          userId: user.id,
        }),
      });
      
      if (response.error) {
        // Revert optimistic update on error
        if (isSaved) {
          addSavedPost(postId);
        } else {
          removeSavedPost(postId);
        }
        setIsSaved(isSaved);
        throw new Error(response.error);
      }
      
      showAlert({
        title: isSaved ? "Post Unsaved" : "Post Saved",
        message: isSaved ? "Post removed from your saved items." : "Post added to your saved items.",
        type: "SUCCESS",
        status: "success",
      });
      
    } catch (error) {
      console.error("Error saving/unsaving post:", error);
      showAlert({
        title: "Error",
        message: `Failed to ${isSaved ? "unsave" : "save"} post. Please try again.`,
        type: "ERROR",
        status: "error",
      });
    }
  }, [isSaved, user, soundEffectsEnabled, playSoundEffect, removeSavedPost, addSavedPost, showAlert]);

  const dateCreated = convertToLocal(new Date(currentPost?.created_at || ""));
  const formattedDate = formatDateTruncatedMonth(dateCreated);
  const postColor = allColors.find(
    (color) => color.id === currentPost?.color
  ) as PostItColor;

  const swipeGesture = Gesture.Pan()
    .onStart((event) => {
      console.log("Swipe started");
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd(() => {
      const threshold = 15;
      const isLastPost = currentPostIndex === posts.length - 1;

      if (translateX.value > threshold && currentPostIndex > 0) {
        translateX.value = withTiming(0);
        opacity.value = withTiming(0, {}, () => {
          runOnJS(setCurrentPostIndex)(currentPostIndex - 1);
          opacity.value = withTiming(1);
        });
      } else if (translateX.value < -threshold) {
        if (!isLastPost) {
          // Swipe left: go to next post
          translateX.value = withTiming(0);
          opacity.value = withTiming(0, {}, () => {
            runOnJS(setCurrentPostIndex)(currentPostIndex + 1);
            opacity.value = withTiming(1);
          });
        } else {
          // Bounce back
          translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        }
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  // Animated styles for swiping
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(translateX.value, {
          damping: 20,
          stiffness: 300,
        }),
      },
    ],
    opacity: withTiming(opacity.value),
  }));

  const handleLikePress = async () => {
    if (isLoadingLike || !currentPost?.id || !user?.id) return;
    setIsLoadingLike(true);
    try {
      // Play like sound if liking (not unliking) and enabled
      if (!isLiked && soundEffectsEnabled) {
        playSoundEffect(SoundType.Like);
      }
      const increment = !isLiked;
      setIsLiked(increment);
      setLikeCount((prev) => (increment ? prev + 1 : prev - 1));

      console.log("[handleLikePress] Sending request with payload:", {
        postId: currentPost.id,
        userId: user.id,
        increment,
      });

      const response = await fetchAPI(`/api/posts/updateLikeCount`, {
        method: "PATCH",
        body: JSON.stringify({
          postId: currentPost.id,
          userId: user.id,
          increment,
        }),
      });

      console.log("[handleLikePress] Received response:", response);

      if (response.error) {
        console.error("[handleLikePress] Error in response:", response.error, response.details);
        setIsLiked(!increment);
        setLikeCount((prev) => (increment ? prev - 1 : prev + 1));
        showAlert({
          title: "Error",
          message: "Unable to update like status.",
          type: "ERROR",
          status: "error",
        });
        return;
      }

      setIsLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
    } catch (error) {
      console.error("Failed to update like status:", error);
    } finally {
      setIsLoadingLike(false);
    }
  };

  const findUserNickname = (
    userArray: UserNicknamePair[],
    userId: string
  ): number => {
    const index = userArray.findIndex((pair) => pair[0] === userId);
    return index;
  }

  const handleDeletePress = async () => {
    handleCloseModal();

    showAlert({
      title: "Delete Post",
      message: "Are you sure you want to delete this post?",
      type: "DELETE",
      status: "success",
      action: async () => {
        try {
          const response = await fetchAPI(
            `/api/posts/deletePost?id=${currentPost?.id}`,
            {
              method: "DELETE",
            }
          );

          if (response.error) {
            throw new Error(response.error);
          }
        } catch (error) {
          console.error("Failed to delete post:", error);
          showAlert({
            title: "Error",
            message: "Failed to delete post. Please try again.",
            type: "ERROR",
            status: "error",
          });
        } finally {
          showAlert({
            title: "Post deleted",
            message: "Your post has been deleted successfully.",
            type: "DELETE",
            status: "success",
          });
        }
      },
      actionText: "Delete",
      duration: 5000,
    });
  };

 

  const handleCommentsPress = () => {
    const current = post[currentPostIndex];
    setSelectedBoard(() => (
      <PostScreen id={String(current.id)} clerkId={current.user_id} />
    ));
  };



  // Capture the content as soon as the component mounts (first render)
  useEffect(() => {
    if (selectedPosts) {
      setTimeout(() => {
        handleCapture(); // Capture content on first render when modal is visible
      }, 800);
    }
  }, [selectedPosts]);
  useEffect(() => {
    setTimeout(() => {
      if (viewRef.current) {
        viewRef.current.measure((x, y, width, height) => {
          // console.log(x, y, width, height);
        });
      }
    }, 500); // Small delay to ensure the view is ready
  }, []);


  const backgroundColor = useSharedValue(
    postColor?.hex || "rgba(0, 0, 0, 0)"
  );
  const prevColor = useRef<string>(postColor?.hex || "rgba(0, 0, 0, 0.5)");

  // Animate color change
  useEffect(() => {
    const newColor = postColor?.hex || "rgba(0, 0, 0, 0.5)";
    if (prevColor.current !== newColor) {
      backgroundColor.value = withTiming(newColor, {
        duration: 300,
        easing: Easing.inOut(Easing.quad),
      });
      prevColor.current = newColor;
    }
  }, [postColor]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSelectedEmoji(post[currentPostIndex]?.emoji);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [post, currentPost]);

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
  }));

  useFocusEffect(
    useCallback(() => {
      // Screen is focused

      return () => {
        setTimeout(() => {
          handleCloseModal();
          setSelectedBoard(null);
        }, 250);
      };
    }, [])
  );

  const cleanFormatting: Format[] = isPreview
    ? (draftPost?.formatting ?? [])
    : typeof currentPost?.formatting === "string"
      ? JSON.parse(currentPost.formatting)
      : (currentPost?.formatting ?? []);

  return (
    <AnimatedView
      ref={viewRef}
      className="flex-1 absolute w-screen h-screen justify-center"
      entering={FadeInUp.duration(300)}
      style={[animatedBackgroundStyle]}
    >
      <TouchableWithoutFeedback onPress={() => handleCloseModal()}>
        <View className="absolute flex-1 top-0 -ml-3">
          {
            <EmojiBackground
              emoji={isEmojiStatic ? selectedEmoji : ""}
              color=""
            />
          }
        </View>
      </TouchableWithoutFeedback>

      {header}
      {currentPost?.prompt && !isPreview && (
              <Animated.View
                className="absolute w-full top-[25%] mx-auto flex-row items-center justify-center"
                entering={FadeInUp.duration(200)}
                exiting={FadeOutDown.duration(200)}
              >
                <TouchableOpacity
                 className="w-[75%] max-w-[300px]"
                 onPress={() => {
                  router.push({
                  pathname: "/root/new-post",
                  params: {
                    prompt: currentPost?.prompt,
                    promptId: currentPost?.prompt_id,
                  },
                });
                 }}>
                  <Text className="text-center text-[18px] font-JakartaSemiBold text-white shadow-md ">
                    {currentPost?.prompt}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

      <GestureHandlerRootView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <GestureDetector gesture={swipeGesture}>
          <Animated.View
            entering={FadeInUp.duration(400)}
            exiting={FadeOutDown.duration(250)}
            className="bg-white px-6 py-4 rounded-[24px] w-[80%] max-w-[500px] mx-auto"
            style={[
              animatedStyle,
              {
                minHeight: isIpad ? 250 : 200,
                maxHeight: isIpad ? "55%" : "40%",
                backgroundColor: "rgba(255, 255, 255, 1)",
              },
            ]}
          >
            <TouchableOpacity onPress={handleCloseModal}>
              <Image
                source={icons.close}
                style={{
                  width: 18,
                  height: 18,
                  top: 4,
                  alignSelf: "flex-end",
                  opacity: 0.5,
                }}
              />
            </TouchableOpacity>

            <ScrollView>
              <RichText
                formatStyling={cleanFormatting}
                content={currentPost?.content ?? ""}
              />
            </ScrollView>
            {!isPreview && (
              <View className="my-2 flex-row justify-between items-center">
                <View className="flex flex-row items-center">
                  <TouchableOpacity onPress={handleCommentsPress}>
                    <Image source={icons.comment} className="w-7 h-7" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleLikePress} className="ml-2">
                    <MaterialCommunityIcons
                      name={isLiked ? "heart" : "heart-outline"}
                      size={31}
                      color={isLiked ? "red" : "black"}
                    />
                  </TouchableOpacity>
                  {/* Show like count only to post creator */}
                  {currentPost?.user_id == user?.id && (
                    <Text className="ml-1 text-gray-600">{likeCount}</Text>
                  )}
                </View>
                {
                  <DropdownMenu
                    menuItems={getMenuItems(
                      (currentPost?.user_id === user?.id) ||
                        (currentPost?.recipient_user_id === user?.id),
                      invertedColors,
                      isPreview
                    )}
                  />
                }
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
      <View
        className={`absolute flex flex-row ${isShowCasing ? "top-40 left-8" : "top-16 left-8"}`}
      >
        {posts.length > 1 &&
          posts.map((post, index) => {
            return (
              <CarrouselIndicator
                key={post.id}
                id={index}
                index={currentPostIndex}
                color={"#FFFFFF"}
              />
            );
          })}
      </View>
      {!!selectedEmoji && !isEmojiStatic && (
        <View className="absolute -top-[150px] self-center inset-0">
          <EmojiExplosionModal
            isVisible={!!selectedEmoji}
            verticalForce={50}
            radius={isIpad ? 1200 : 800}
            emojiSize="text-[150px]"
            duration={8000}
            emoji={selectedEmoji}
            onComplete={() => {
              setSelectedEmoji("");
              console.log("done");
            }}
          />
        </View>
      )}
      
        <ModalSheet
          isVisible={!!selectedBoard}
          title={"Comments"}
          onClose={() => {
            if (currentPost) {
              handleReadComments(currentPost, user!.id);
            }
            console.log("has closed.");
            setSelectedBoard(null);
          }}
        >
          <View className="flex-1 h-full">{selectedBoard}</View>
        </ModalSheet>
    </AnimatedView>
  );
});

export default PostContainer;

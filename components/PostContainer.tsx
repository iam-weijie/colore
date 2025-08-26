import { useEncryptionContext } from "@/app/contexts/EncryptionContext";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects"; // Import sound hook
import { useDecryptPosts } from "@/hooks/useDecrypt";
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
  deletePost,
} from "@/lib/post";
import { fetchAPI } from "@/lib/fetch";
import { convertToLocal, formatDateTruncatedMonth, isValidDate } from "@/lib/utils";
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
import CommentView from "@/app/root/post/[id]";
import ItemContainer from "./ItemContainer";
import EmojiBackground from "./EmojiBackground";
import { RichText } from "./RichTextInput";
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
  allowedComments = true
}) => {
  const { stacks, setStacks } = useStacks();
  const { draftPost, setDraftPost } = useDraftPost();
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

  // Use the new decrypt posts hook
  const { decryptPosts } = useDecryptPosts({
    encryptionKey,
    debugPrefix: "PostContainer"
  });

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

  console.log("[CONTAINER] Number of posts: ", post.length);

  // Check if post is saved and pinned
  useEffect(() => {
    if (currentPost) {
      // Check if post is saved
      if (savedPosts) {
        setIsSaved(savedPosts.includes(String(currentPost.id)));
      }
      
      // Check if post is pinned
      setIsPinned(currentPost.pinned || false);
    }
  }, [currentPost, savedPosts]);

  useEffect(() => {
    if (post.length) {
      // Filter out any invalid posts
      const validPosts = post.filter(p => p && typeof p === 'object');
      
      if (validPosts.length !== post.length) {
        console.warn("[DEBUG] PostContainer - Filtered out invalid posts:", post.length - validPosts.length);
      }
      
      setPosts(validPosts);
      
      // Make sure we have a valid current post index
      const safeIndex = Math.min(currentPostIndex, validPosts.length - 1);
      if (safeIndex >= 0 && validPosts[safeIndex]) {
        setCurrentPost(validPosts[safeIndex]);
        setIsEmojiStatic(validPosts[safeIndex]?.static_emoji ?? false);
      }
      
      // Debug logging
      console.log("[DEBUG] PostContainer - Received valid posts:", validPosts.length);
      if (validPosts.length > 0) {
        console.log("[DEBUG] PostContainer - First post ID:", validPosts[0].id);
        console.log("[DEBUG] PostContainer - First post content:", validPosts[0].content?.substring(0, 30) || "No content");
      }
    }
  }, [post, currentPostIndex]);

  useEffect(() => {
    // Only update current post if we have valid posts and a valid index
    if (posts.length > 0 && currentPostIndex >= 0 && currentPostIndex < posts.length) {
      const newCurrentPost = posts[currentPostIndex];
      
      if (!newCurrentPost || !newCurrentPost.id) {
        console.error("[DEBUG] PostContainer - Invalid post at index:", currentPostIndex);
        return;
      }
      
      setCurrentPost(newCurrentPost);
      console.log("[DEBUG] PostContainer - Current post updated:", currentPostIndex);
      console.log("[DEBUG] PostContainer - Current post ID:", newCurrentPost.id);
      
      if (newCurrentPost.content) {
        console.log("[DEBUG] PostContainer - Current post content:", newCurrentPost.content.substring(0, 30));
        
        // Always use the hook to process the post (it handles both encrypted and non-encrypted posts)
        if (newCurrentPost.recipient_user_id && encryptionKey) {
          try {
            // Use the hook to decrypt the post
            const decryptedPosts = decryptPosts([newCurrentPost]);
            const processedPost = decryptedPosts[0];
            
            if (processedPost) {
              console.log("[DEBUG] PostContainer - Processed content:", processedPost.content.substring(0, 30));
              
              // Always update the current post with the processed result
              setCurrentPost(processedPost);
            }
          } catch (error) {
            console.error("[DEBUG] PostContainer - Decryption failed:", error);
            // Fallback to original post on error
            setCurrentPost(newCurrentPost);
          }
        } else {
          // For non-personal posts or when no encryption key, just set the post as is
          setCurrentPost(newCurrentPost);
        }
      } else {
        console.warn("[DEBUG] PostContainer - Post has no content:", newCurrentPost.id);
        setCurrentPost(newCurrentPost);
      }

      if (
        infiniteScroll &&
        typeof scrollToLoad === "function" &&
        currentPostIndex + 1 === posts.length - 1
      ) {
        // If last post and infiniteScroll is enabled
        scrollToLoad();
      }
    }
  }, [currentPostIndex, encryptionKey, infiniteScroll, scrollToLoad, posts, decryptPosts]);

  useEffect(() => {
    console.log("[PostContainer] See Comment: ", seeComments)
    if (seeComments) {
      setTimeout(() => {
        handleCommentsPress();
      }, 800);
    }
  }, [seeComments]);


  // Fetch like status when current post changes
// keep your existing state: isLiked, likeCount, currentPost, user…

useEffect(() => {
  if (!currentPost?.id || !user?.id) return;

  // Debounce: wait 250–300ms after currentPost/user settles
  const t = setTimeout(async () => {
    try {
      const status = await fetchLikeStatus(currentPost.id, user.id);
      setIsLiked(status.isLiked);
      setLikeCount(status.likeCount);
    } catch (err) {
      // swallow or log; avoids noisy "Premature close" during fast swipes
      if (__DEV__) console.warn("fetchLikeStatus failed:", err);
    }
  }, 250);

  // Cancel pending call if post/user changes again or component unmounts
  return () => clearTimeout(t);
}, [currentPost?.id, user?.id]);



  const handleLikePress = async () => {
    if (isLoadingLike || !currentPost?.id || !user?.id) return;
    setIsLoadingLike(true);
    try {
      // Play like sound if liking (not unliking) and enabled
      if (!isLiked && soundEffectsEnabled) {
        playSoundEffect(SoundType.Tap);
      }
      const increment = !isLiked;
      setIsLiked(increment);
      setLikeCount((prev) => (increment ? prev + 1 : prev - 1));

      const response = await fetchAPI(`/api/posts/updateLikeCount`, {
        method: "PATCH",
        body: JSON.stringify({
          postId: currentPost.id,
          userId: user.id,
          increment,
        }),
      });

      if (response.error) {
        setIsLiked(!increment);
        setLikeCount((prev) => (increment ? prev - 1 : prev + 1));
        showAlert({
          title: 'Error',
          message: "Unable to update like status.",
          type: 'ERROR',
          status: 'error',
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

  const handleDeletePress = useCallback(async () => {
    if (!currentPost || !user) return;
    
    // Add confirmation dialog
    Alert.alert(
      "Delete Post", 
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Deleting post using the exported function:", currentPost.id);
              
              // Use our improved deletePost function
              const result = await deletePost(currentPost.id, user.id);
              
              if (!result.success) {
                throw new Error(result.error || "Failed to delete post");
              }
              
              showAlert({
                title: "Post Deleted",
                message: "Your post has been deleted.",
                type: "SUCCESS",
                status: "success",
              });
              
              // Call handleUpdate with isPinned=false since the post is being deleted
              if (handleUpdate) {
                handleUpdate(false);
              }
              
              // Close modal without state updates
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
          }
        }
      ]
    );
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
    isPreview: boolean
  ) => {
    const menuItems = [];
    
    if (!isPreview) {
      // Add Pin/Unpin option for personal posts (when the current user is the recipient)
      if (currentPost?.recipient_user_id === user?.id) {
        // Only show pin option for personal posts
        menuItems.push({
          source: icons.pin,
          label: Boolean(currentPost?.pinned) ? "Unpin" : "Pin",
          color: "#E1E1E1",
          onPress: async () => {
            if (currentPost && user) {
              console.log(`Attempting to ${Boolean(currentPost?.pinned) ? "unpin" : "pin"} post:`, currentPost.id);
              
              // First close the menu if in profile view to prevent UI issues
              if (currentPost?.recipient_user_id === user?.id) {
                console.log("Pin action in profile view - handling specially");
                // Close menu and modal immediately to prevent UI conflicts
                if (handleCloseModal) {
                  handleCloseModal();
                }
                
                // Short delay before making the API call
                setTimeout(async () => {
                  try {
                    // Pass the current pinned status to the API
                    const isPinned = Boolean(currentPost.pinned);
                    
                    // Call API directly to update pin status
                    const newPinnedStatus = await handlePin(currentPost, isPinned, user.id);
                    console.log("Profile pin operation result:", newPinnedStatus);
                    
                    // Force a refresh of the profile to show updated pins
                    router.setParams({ refresh: Date.now().toString() });
                    
                    // Show success alert
                    showAlert({
                      title: isPinned ? "Post Unpinned" : "Post Pinned",
                      message: isPinned ? "Post removed from pinned items." : "Post pinned to your profile.",
                      type: "SUCCESS",
                      status: "success",
                    });
                  } catch (error) {
                    console.error("Failed to update pin status:", error);
                    showAlert({
                      title: "Error",
                      message: `Failed to ${currentPost.pinned ? "unpin" : "pin"} post. Please try again.`,
                      type: "ERROR",
                      status: "error",
                    });
                  }
                }, 300);
                return;
              }
              
              // Standard handling for post gallery view
              // Pass the current pinned status to the API
              const isPinned = Boolean(currentPost.pinned);
              
              try {
                // Update the post's pinned status locally first (optimistic update)
                setCurrentPost({
                  ...currentPost,
                  pinned: !isPinned
                });
                
                // Set isPinned state for UI update
                setIsPinned(!isPinned);
                
                // Call API to update pinned status
                const newPinnedStatus = await handlePin(currentPost, isPinned, user.id);
                console.log("Pin operation result:", newPinnedStatus);
                
                // Need to close the modal first so the parent component can update
                if (handleCloseModal) {
                  handleCloseModal();
                }
                
                // Signal to parent component about pin change if needed
                if (handleUpdate) {
                  console.log("Calling handleUpdate with pin status:", newPinnedStatus);
                  // This component's handleUpdate expects just a boolean
                  handleUpdate(newPinnedStatus);
                  
                  // Force a full refresh of personal posts when a pin status changes
                  if (currentPost?.recipient_user_id === user?.id || currentPost?.user_id === user?.id) {
                    // Trigger a refresh via the router navigation 
                    // This will force the profile to fetch new data
                    setTimeout(() => {
                      console.log("Refreshing profile after pin status change");
                      router.setParams({ refresh: Date.now().toString() });
                    }, 300);
                  }
                }
                
                // Show success alert
                showAlert({
                  title: isPinned ? "Post Unpinned" : "Post Pinned",
                  message: isPinned ? "Post removed from pinned items." : "Post pinned to your profile.",
                  type: "SUCCESS",
                  status: "success",
                });
              } catch (error) {
                console.error("Failed to update pin status:", error);
                // Revert the optimistic update on error
                setCurrentPost({
                  ...currentPost,
                  pinned: isPinned
                });
                setIsPinned(isPinned);
                
                // Show error alert
                showAlert({
                  title: "Error",
                  message: `Failed to ${isPinned ? "unpin" : "pin"} post. Please try again.`,
                  type: "ERROR",
                  status: "error",
                });
              }
            }
          },
        });
      }
      

      
      menuItems.push({
        source: icons.bookmark,
        label: isSaved ? "Unsave" : "Save",
        color: isSaved ? "#CFB1FB" : "#E2C7FF",
        onPress: () => handleSavePostPress(currentPost?.id),
      });

      
      if (!isOwner) {
        menuItems.push({
          source: icons.info,
          label: "Report",
          color: "#4689a1",
          onPress: () => {
            Linking.openURL("mailto:support@colore.ca");
          },
        });
      }

      if (isOwner) {

        menuItems.push({
          source: icons.pencil,
          label: "Edit",
          color: "#6bc6c9",
          onPress: () => {
            if (currentPost) {
              setDraftPost(currentPost);
              handleEditing(currentPost);
            }
          }
        });
          menuItems.push({
            source: icons.trash,
            label: "Delete",
            color: "#DA0808",
            onPress: handleDeletePress,
          });
  
  
        }
    }
    
    return menuItems;
  }, [isSaved, handleDeletePress, handleCapture, currentPost, user, handleUpdate, setCurrentPost]);

  const handleSavePostPress = useCallback(async (postId: number | undefined) => {
    if (!postId || !user) return;
    
    try {
      console.log(`${isSaved ? "Unsaving" : "Saving"} post:`, postId);
      
      // Play sound effect
      if (soundEffectsEnabled) {
        playSoundEffect(SoundType.Tap);
      }
      
      // Optimistic update
      if (isSaved) {
        removeSavedPost(postId);
      } else {
        addSavedPost(postId);
      }
      
      setIsSaved(!isSaved);
      
      // Show immediate feedback
      showAlert({
        title: isSaved ? "Post Unsaved" : "Post Saved",
        message: isSaved ? "Post removed from your saved items." : "Post added to your saved items.",
        type: "SUCCESS",
        status: "success",
      });
      
      // Use the lib function that might handle the API call differently
      try {
        await libHandleSavePost(postId, !isSaved, user.id);
        console.log(`Successfully ${isSaved ? "unsaved" : "saved"} post ${postId} via lib function`);
      } catch (apiError) {
        console.error(`Error in API call to ${isSaved ? "unsave" : "save"} post:`, apiError);
        // No need to show another error or revert UI state since we've already
        // updated the local state optimistically
      }
      
    } catch (error) {
      console.error("Error in handleSavePostPress:", error);
      
      // Revert optimistic update on error
      if (!isSaved) { // We already toggled isSaved, so check the opposite
        removeSavedPost(postId);
      } else {
        addSavedPost(postId);
      }
      setIsSaved(!isSaved); // Revert back
      
      showAlert({
        title: "Error",
        message: `Failed to ${isSaved ? "save" : "unsave"} post. Please try again.`,
        type: "ERROR",
        status: "error",
      });
    }
  }, [isSaved, user, soundEffectsEnabled, playSoundEffect, addSavedPost, removeSavedPost, showAlert, libHandleSavePost]);

  // Helper function to safely handle dates
  const safeConvertToLocal = useCallback((dateString: string | undefined | null) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (!isValidDate(date)) {
        console.warn(`[DEBUG] PostContainer - Invalid date: ${dateString}`);
        return '';
      }
      return convertToLocal(date);
    } catch (error) {
      console.warn(`[DEBUG] PostContainer - Error converting date: ${error}`);
      return '';
    }
  }, []);

  const getPostDate = useCallback(() => {
    if (!currentPost || !currentPost.created_at) return '';
    
    return safeConvertToLocal(currentPost.created_at);
  }, [currentPost, safeConvertToLocal]);

  const dateCreated = getPostDate();
  // Only format the date if it's a valid Date object
  const formattedDate = dateCreated ? formatDateTruncatedMonth(dateCreated) : '';
  const postColor = allColors.find(
    (color) => color.id === currentPost?.color
  ) as PostItColor;

  const swipeGesture = Gesture.Pan()
    .onStart((event) => {
      console.log("Swipe started!!");
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd(() => {
      const threshold = 15;
      const isLastPost = currentPostIndex === posts.length - 1;

      // Improved navigation between posts with better animation timing
      if (translateX.value > threshold && currentPostIndex > 0) {
        // Swiping right - go to previous post
        translateX.value = withTiming(0, { duration: 200 });
        opacity.value = withTiming(0, { duration: 150 }, () => {
          //runOnJS(setCurrentPostIndex)(currentPostIndex - 1);
          // Small delay before fading in new post
          setTimeout(() => {
            opacity.value = withTiming(1, { duration: 250 });
          }, 50);
          
          // Provide haptic feedback for navigation
          if (soundEffectsEnabled) {
            runOnJS(playSoundEffect)(SoundType.Navigation);
          }
        });
      } else if (translateX.value < -threshold) {
        if (!isLastPost) {
          // Swipe left: go to next post
          translateX.value = withTiming(0, { duration: 200 });
          opacity.value = withTiming(0, { duration: 150 }, () => {
            //runOnJS(setCurrentPostIndex)(currentPostIndex + 1);
            // Small delay before fading in new post
            setTimeout(() => {
              opacity.value = withTiming(1, { duration: 250 });
            }, 50);
            
            // Provide haptic feedback for navigation
            if (soundEffectsEnabled) {
              runOnJS(playSoundEffect)(SoundType.Navigation);
            }
          });
        } else {
          // Bounce back with more pronounced animation for better feedback
          translateX.value = withSequence(
            withTiming(-10, { duration: 100 }),
            withSpring(0, { damping: 25, stiffness: 400 })
          );
        }
      } else {
        // Small movement - bounce back smoothly
        translateX.value = withSpring(0, { damping: 25, stiffness: 400 });
      }
    });

  // Animated styles for swiping
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: translateX.value,
      },
    ],
    opacity: opacity.value,
  }));


  const handleCommentsPress = () => {
    const current = post[currentPostIndex];
    setSelectedBoard(() => (

      <CommentView id={String(current.id)} clerkId={current.user_id} color={currentPost?.color ?? ""} anonymousParam={invertedColors} likes={likeCount}/>
          
    ));
  };



  useEffect(() => {
    if (selectedPosts) {
      setTimeout(() => {
        setShowEmojiModal(false);
      }, 2000);
      
    }
  }, [currentPost, user, soundEffectsEnabled, playSoundEffect]);

  

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

      console.log("content: ", currentPost?.content)
      console.log("[DEBUG] PostContainer - Final content check:", {
        hasCurrentPost: !!currentPost,
        hasContent: !!currentPost?.content,
        contentLength: currentPost?.content?.length || 0,
        contentPreview: currentPost?.content?.substring(0, 50) || "No content",
        isPreview,
        hasDraftPost: !!draftPost,
        draftContent: draftPost?.content?.substring(0, 50) || "No draft content"
      });
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
              {(currentPost && currentPost.content) || (isPreview && draftPost?.content) ? (
                <RichText
                  formatStyling={cleanFormatting}
                  content={isPreview && draftPost ? draftPost.content : (currentPost?.content || '')}
                />
              ) : (
                <Text className="text-gray-700 py-2 text-center">
                  No content to display
                </Text>
              )}
            </ScrollView>
            {isPreview ? (<></>) : isShowCasing ? (<></>) : (
              <View className="my-2 flex-row justify-between items-center">
                <View className="flex flex-row items-center">
                  {allowedComments && <TouchableOpacity onPress={handleCommentsPress}>
                    <Image source={icons.comment} className="w-7 h-7" />
                  </TouchableOpacity>}
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
                      (currentPost?.user_id === user?.id),
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
          {selectedBoard}
        </ModalSheet>
    </AnimatedView>
  );
});

export default PostContainer;

import { useGlobalContext } from "@/app/globalcontext";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects"; // Import sound hook
import { useSoundGesture } from "@/hooks/useSoundGesture"; // Import swipe sound hook
import { icons, temporaryColors } from "@/constants/index";
import { fetchAPI } from "@/lib/fetch";
import { convertToLocal, formatDateTruncatedMonth, getRelativeTime } from "@/lib/utils";
import {
  Post,
  PostItColor,
  PostModalProps,
  UserNicknamePair,
} from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import ReactNativeModal from "react-native-modal";
import Animated, {
  BounceIn,
  Easing,
  FadeInUp,
  FadeOutDown,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn
} from "react-native-reanimated";
import { captureRef } from "react-native-view-shot";
import DropdownMenu from "./DropdownMenu";
import { useAlert } from '@/notifications/AlertContext';
import InteractionButton from "./InteractionButton";
import CarrouselIndicator from "./CarrouselIndicator";
import EmojiExplosionModal from "./EmojiExplosiveModal";


const { width, height } = Dimensions.get("window");



const AnimatedView = Animated.createAnimatedComponent(View);

const PostModal: React.FC<PostModalProps> = ({
  isVisible,
  selectedPost,
  handleCloseModal,
  handleUpdate,
  invertedColors = false,
  header,
  isPreview = false,
  infiniteScroll = false,
  scrollToLoad,
}) => {
  const { stacks, isIpad, soundEffectsEnabled } = useGlobalContext(); // Add soundEffectsEnabled
  const { playSoundEffect } = useSoundEffects(); // Get sound function
  const { panGestureHandlers, handlePanGestureStateChange } = useSoundGesture(SoundType.Swipe);
  const { user } = useUser();
  const [nickname, setNickname] = useState<string>("");
  const [currentPost, setCurrentPost] = useState<Post>(selectedPost);
  const [currentPostIndex, setCurrentPostIndex] = useState<number>(0);
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isLoadingLike, setIsLoadingLike] = useState<boolean>(false);
  const [showEmojiModal, setShowEmojiModal] = useState<boolean>(false);
   const { showAlert } = useAlert();
  const router = useRouter();
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const viewRef = useRef<View>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Memoize the posts array to prevent unnecessary re-renders
  const post = useMemo(() => {
    
    const stack = stacks.find((stack) => stack.ids.includes(selectedPost.id));
    return stack ? stack.elements : [selectedPost];
  }, [stacks]);

  useEffect(() => {
    fetchUserdata();
    fetchLikeStatus();
  }, [isSaved, isLiked, user]);

  useEffect(() => {
    if (post.length) {
      setPosts(post);
      setCurrentPost(post[currentPostIndex]);
    }
  }, [post]);

  const fetchLikeStatus = async () => {
    try {
      const response = await fetchAPI(
        `/api/posts/updateLikeCount?postId=${post[currentPostIndex].id}&userId=${user!.id}`,
        { method: "GET" }
      );
      if (response.error) return;

      setIsLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
    } catch (error) {
      console.error("Failed to fetch like status:", error);
    }
  };

  useEffect(() => {
    setCurrentPost(post[currentPostIndex]);


    if (infiniteScroll && typeof scrollToLoad === "function" && currentPostIndex + 1 === posts.length - 1) {
      // If last post and infiniteScroll is enabled
      runOnJS(scrollToLoad)();
      console.log("loaded more posts", selectedPost.id);
      
    } 
  }, [currentPostIndex])
  // Fetch like status only when post or user changes
  useEffect(() => {
    if (!user?.id || !currentPost?.id) return;
    fetchLikeStatus();
    setIsPinned(currentPost?.pinned)
  }, [post, currentPostIndex, user?.id]);

  const dateCreated = convertToLocal(
    new Date(currentPost?.created_at || "")
  );
  const formattedDate = getRelativeTime(dateCreated);
  const postColor = temporaryColors.find(
    (color) => color.name === currentPost?.color
  ) as PostItColor;


  const swipeGesture = Gesture.Pan()
    .onStart((event) => {
      console.log("Swipe started");
      if (soundEffectsEnabled) {
        try {
          panGestureHandlers.onStart();
        } catch (error) {
          console.log("Error playing swipe start sound:", error);
        }
      }
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd(() => {
      const threshold = 15;
      const isLastPost = currentPostIndex === posts.length - 1;
      
      if (soundEffectsEnabled) {
        try {
          panGestureHandlers.onEnd();
        } catch (error) {
          console.log("Error playing swipe end sound:", error);
        }
      }
      
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
    })

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
        playSoundEffect(SoundType.Like).catch(error => {
          console.log("Error playing like sound:", error);
        });
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

  function findUserNickname(
    userArray: UserNicknamePair[],
    userId: string
  ): number {
    const index = userArray.findIndex((pair) => pair[0] === userId);
    return index;
  }

  const fetchCurrentNickname = async () => {
    try {
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`, {
        method: "GET",
      });
      if (response.error) {
        throw new Error(response.error);
      }
      const nicknames = response.data[0].nicknames || [];
      
      return findUserNickname(nicknames, currentPost?.clerk_id || "") === -1
        ? ""
        : nicknames[findUserNickname(nicknames, currentPost?.user_id || "")][1];
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      return "";
    }
  };
  useEffect(() => {
    const getData = async () => {
      const nickname = await fetchCurrentNickname();
      setNickname(nickname);
    };
    getData();
  }, [user]);

  const fetchUserdata = async () => {
    try {
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`);
      const savePostsList = response.data[0].saved_posts;
      const savedStatus = savePostsList?.includes(
        `${currentPost?.id}`
      ) ?? false;
      setSavedPosts(savePostsList);
      setIsSaved(savedStatus);
    } catch (error) {
      console.error("Failed to fetch user data", error);
    }
  };

  const handleDeletePress = async () => {
    handleCloseModal();
    
    showAlert({
      title: 'Delete Post',
      message: "Are you sure you want to delete this post?",
      type: 'DELETE',
      status: 'success',
      action: () => {
        handleDelete()
      },
      actionText: "Delete",
      duration: 5000,
    });
  };

  const handleReportPress = () => {
    Linking.openURL("mailto:support@colore.ca");
  };

  const handleEditing = () => {
    setTimeout(() => {
      handleCloseModal();
    }, 250);
    setTimeout(() => {
      router.push({
        pathname: "/root/new-post",
        params: {
          postId: currentPost?.id,
          content: currentPost?.content,
          color: currentPost?.color,
          emoji: currentPost?.emoji,
        },
      });
    }, 750);
  };

  const handleDelete = async () => {
    try {
      const response = await fetchAPI(
        `/api/posts/deletePost?id=${currentPost!.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.error) {
        throw new Error(response.error);
      }
     handleCloseModal();

      
    } catch (error) {
      console.error("Failed to delete post:", error);
      showAlert({
        title: 'Error',
        message: "Failed to delete post. Please try again.",
        type: 'ERROR',
        status: 'error',
      });
    } finally {
      showAlert({
        title: 'Post deleted',
        message: "Your post has been deleted successfully.",
        type: 'DELETE',
        status: 'success',
      });
    }
  };

  const handleCommentsPress = () => {
    handleCloseModal();

    console.log()

    router.push({
      pathname: "/root/post/[id]",
      params: {
        id: currentPost?.id,
        clerk_id: currentPost?.clerk_id,
        content: currentPost?.content,
        username: currentPost?.username,
        like_count: currentPost?.like_count,
        report_count: currentPost?.report_count,
        created_at: currentPost?.created_at,
        unread_comments: currentPost?.unread_comments,
        anonymous: invertedColors,
        color: currentPost?.color,
        saved: isSaved,
      },
    });
  };

  const handleSavePost = async (postId: number) => {
    try {
      await fetchAPI(`/api/users/updateUserSavedPosts`, {
        method: "PATCH",
        body: JSON.stringify({
          clerkId: user!.id,
          postId: postId,
          isSaved: isSaved,
        }),
      });
    } catch (error) {
      console.error("Failed to update unread message:", error);
    } finally {
      setIsSaved((prevIsSaved) => !prevIsSaved);
      //handleUpdate
    }
  };

  const handleInteractionPress = (emoji: string) => {
    setSelectedEmoji(emoji)
  }

  // Capture the content as soon as the component mounts (first render)
  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        handleCapture(); // Capture content on first render when modal is visible
      }, 800);
    }
  }, [isVisible]);
  useEffect(() => {
    setTimeout(() => {
      if (viewRef.current) {
        viewRef.current.measure((x, y, width, height) => {
          // console.log(x, y, width, height);
        });
      }
    }, 500); // Small delay to ensure the view is ready
  }, []);

  const handleCapture = async () => {
    if (!isVisible) {
      console.warn("Modal is not visible, skipping capture.");
      return;
    }

    if (viewRef.current) {
      try {
        const uri = await captureRef(viewRef.current, {
          format: "png",
          quality: 0.8,
        });

        setImageUri(uri); // Save the captured URI for later sharing
      } catch (error) {
        console.error("Error capturing view:", error);
      }
    }
  };

  const handleShare = async () => {
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
        message: `${currentPost?.content.trim()} \n\nDownload Coloré here:https://apps.apple.com/ca/app/coloré/id6738930845`,
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

  const handlePin = async () => {
    try {
      await fetchAPI(`/api/posts/updatePinnedPost`, {
        method: "PATCH",
        body: JSON.stringify({
          userId: user!.id,
          postId: currentPost?.id,
          pinnedStatus: !isPinned,
        }),
      });
    } catch (error) {
      console.error("Failed to update handlepin message:", error);
    } finally {
      handleUpdate(!isPinned)
      setIsPinned((prevIsPinned) => !prevIsPinned);
      handleCloseModal;
    }
  };


  useEffect(() => {
    if (imageUri) {
      // console.log("Image URI has been set:", imageUri);
    }
  }, [imageUri]);



  // COMPONENT RENDER

  const BackgroundGridEmoji = (emoji: string) => {
    const GRID_SIZE = isIpad ? 150 : 100; // Size of each square in the grid
    const OFFSET_X = 20; // Offset for odd rows
    const ITEMS_PER_ROW = isIpad ? 9 : 4; // Number of items per row
    const numColumns = ITEMS_PER_ROW;
    const numRows = Math.ceil(height / GRID_SIZE);

    // Generate positions for the grid
    const gridItems = [];
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numColumns; col++) {
        const offsetX = row % 2 === 1 ? OFFSET_X : 0; // Add offset for odd rows
        gridItems.push({
          x: col * GRID_SIZE + offsetX,
          y: row * GRID_SIZE,
        });
      }
    }

    return (
      <View className="absolute w-full h-full ml-3">
        {gridItems.map((item, index) => (
          <View
            key={index}
            className="absolute align-center justify-center"
            style={{
              left: item.x,
              top: item.y,
              width: GRID_SIZE,
              height: GRID_SIZE,
            }}
          >
            <Text style={{ fontSize: 50 }}>{emoji}</Text>
          </View>
        ))}
      </View>
    );
  };

  const getMenuItems = (isOwner: boolean, invertedColors: boolean) => {
    if (isPreview) {
      return []; // Return empty array when in preview mode to disable menu
    }
    
    if (invertedColors) {
      return currentPost?.recipient_user_id === user!.id ? [
        {
          label: isPinned ? "Unpin" : "Pin",
          source: icons.pin,
          color: "#000000",
          onPress: handlePin,
        },
        {
          label: "Share",
          source: icons.send,
          color: postColor?.fontColor || "rgba(0, 0, 0, 0.5)",
          onPress: handleShare,
        },
        {
          label: "Delete",
          source: icons.trash,
          color: "#DA0808",
          onPress: handleDeletePress,
        },
      ] : [
        {
          label: "Share",
          source: icons.send,
          color: postColor?.fontColor || "rgba(0, 0, 0, 0.5)",
          onPress: handleShare,
        },
        {
          label: isSaved ? "Remove" : "Save",
          color: "#000000",
          source: isSaved ? icons.close : icons.bookmark,
          onPress: () => handleSavePost(currentPost?.id),
        },
        {
          label: "Report",
          source: icons.email,
          color: "#DA0808",
          onPress: handleReportPress,
        },
      ];

    }

    return isOwner
      ? [
          {
            label: "Share",
            source: icons.send,
            color: postColor?.fontColor || "rgba(0, 0, 0, 0.5)",
            onPress: handleShare,
          },
          {
            label: "Edit",
            source: icons.pencil,
            color: "#0851DA",
            onPress: handleEditing,
          },
          {
            label: isSaved ? "Remove" : "Save",
            color: "#000000",
            source: isSaved ? icons.close : icons.bookmark,
            onPress: () => handleSavePost(currentPost?.id),
          },
          {
            label: "Delete",
            source: icons.trash,
            color: "#DA0808",
            onPress: handleDeletePress,
          }
        ]
      : [
          {
            label: "Share",
            source: icons.send,
            color: postColor?.fontColor || "rgba(0, 0, 0, 0.5)",
            onPress: handleShare,
          },
          {
            label: isSaved ? "Remove" : "Save",
            color: "#000000",
            source: isSaved ? icons.close : icons.bookmark,
            onPress: () => handleSavePost(currentPost?.id),
          },
          {
            label: "Report",
            source: icons.email,
            color: "#DA0808",
            onPress: handleReportPress,
          },
        ];
  };

  const backgroundColor = useSharedValue(postColor?.hex || "rgba(0, 0, 0, 0.5)");
  const prevColor = React.useRef(backgroundColor.value);

  // Animate color change
  useEffect(() => {
    if (prevColor.current !== (postColor?.hex || "rgba(0, 0, 0, 0.5)")) {
      backgroundColor.value = withTiming(
        postColor?.hex || "rgba(0, 0, 0, 0.5)",
        {
          duration: 300,
          easing: Easing.inOut(Easing.quad)
        }
      );
      prevColor.current = postColor?.hex || "rgba(0, 0, 0, 0.5)";
    }
  }, [postColor]);


  useEffect(() => {

    const timeoutId = setTimeout(() => {
      setSelectedEmoji(post[currentPostIndex]?.emoji);
    }, 300);
  
    return () => clearTimeout(timeoutId);
  }, [post, currentPost])

  useEffect(() => {
console.log(selectedEmoji, "emojic")
  }, [selectedEmoji])

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
  }));


  console.log("current", currentPost)
  return (
      <ReactNativeModal
        isVisible={isVisible}
        backdropColor={"rgba(0,0,0,0)"}
        backdropOpacity={1}
        onBackdropPress={handleCloseModal}
      >
        <AnimatedView
          ref={viewRef}
          className="flex-1 absolute w-screen h-screen justify-center z-[10]"
          style={[
            animatedBackgroundStyle,
            {
              marginLeft: isIpad ? -60 : -19,
            }
          ]}
        >
          <TouchableWithoutFeedback onPress={!isPreview ? handleCloseModal : undefined} >
            {BackgroundGridEmoji("")}
          </TouchableWithoutFeedback>

          {header}
          {currentPost?.prompt &&  <Animated.View 
          className="absolute w-full top-[20%] mx-auto flex-row items-center justify-center"
          entering={FadeInUp.duration(200)}
          exiting={FadeOutDown.duration(200)}>
              <Text className="text-2xl font-JakartaBold text-white text-center w-[85%]">
                {currentPost?.prompt}
              </Text>
            </Animated.View>}

          <GestureHandlerRootView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <GestureDetector gesture={swipeGesture}>
              <Animated.View
                entering={FadeInUp.duration(400)}
                exiting={FadeOutDown.duration(250)}
                className="bg-white px-6 py-4 rounded-[24px] w-[80%] max-w-[500px] mx-auto"
                style={[
                  animatedStyle,
                  {
                    minHeight:isIpad ? 250 : 200,
                    maxHeight: isIpad ? "55%" : "40%",
                    backgroundColor: "rgba(255, 255, 255, 1)",
                  },
                ]}
              >
                <TouchableOpacity onPress={handleCloseModal}>
                  <Image
                    source={icons.close}
                    style={{ width: 24, height: 24, alignSelf: "flex-end" }}
                  />
                </TouchableOpacity>

                <ScrollView>
                  <Text className="text-[16px] p-1 my-4 font-Jakarta">
                  {currentPost?.content}
                  </Text>
                </ScrollView>
                {!isPreview && (
                  <View className="my-2 flex-row justify-between items-center">
                    <View className="flex flex-row items-center">
                      <TouchableOpacity onPress={handleCommentsPress}>
                        <Image source={icons.comment} className="w-8 h-8" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleLikePress} className="ml-2">
                        <MaterialCommunityIcons
                          name={isLiked ? "heart" : "heart-outline"}
                          size={32}
                          color={isLiked ? "red" : "black"}
                        />
                      </TouchableOpacity>
                      {/* Show like count only to post creator */}
                    {currentPost && currentPost.clerk_id === user?.id && (
                        <Text className="ml-1 text-gray-600">{likeCount}</Text>
                      )}
                    </View>
                    {/* Delete button for post owner */}
                    {
                      <DropdownMenu
                        menuItems={getMenuItems(
                          currentPost?.clerk_id === user!.id ||
                            currentPost?.recipient_user_id === user!.id,
                          invertedColors
                        )}
                      />
                    }
                  </View>
                )}
              </Animated.View>
            </GestureDetector>
          </GestureHandlerRootView>
           {infiniteScroll ? (
            <View className="absolute top-[75%] self-center flex flex-row items-center justify-center">
              {currentPost?.prompt_id && <InteractionButton 
              label="Nay"
              icon={icons.close}
              color={"#FF0000"}
              onPress={async () => {
               
                try {
                  console.log("Patching prompts")
                  
                  await fetchAPI(`/api/prompts/updateEngagement`, {
                    method: "PATCH",
                    body: JSON.stringify({
                      clerkId: user?.id,
                      promptId: currentPost?.prompt_id
                    }),
                  });
                } catch (error) {
                  console.error("Failed to update unread comments:", error);
                } finally {
                  handleInteractionPress("😤")
                  const timeoutId = setTimeout(() => {
                  setCurrentPostIndex((prevIndex) => {
                    const newIndex = prevIndex + 1;
                    if (newIndex < 0) {
                      return posts.length - 1; // Loop back to the last post
                    } else if (newIndex >= posts.length) {
                      return 0; // Loop back to the first post
                    }
                    return newIndex;
                  }
                  );
                  translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
                  opacity.value = withTiming(0, {}, () => {
                    runOnJS(setCurrentPostIndex)(currentPostIndex + 1);
                    opacity.value = withTiming(1);
                  }
                  );
                  if (soundEffectsEnabled) {
                    //playSoundEffect(SoundType.Dislike);
                  }
                }, 2000)
                return () => clearTimeout(timeoutId);
                }
             
              }}
              />}
              <InteractionButton 
              label="Reply"
              icon={icons.plus}
              color={postColor?.fontColor || "rgba(0, 0, 0, 0.5)"}
              soundType={SoundType.Reply}
              onPress={() => {
                handleCloseModal();
                if (currentPost?.prompt_id) {
                  router.push({  
                    pathname: "/root/new-post",
                    params: {
                      promptId: currentPost?.prompt_id,
                      prompt: currentPost?.prompt,
                      source: "board"
                    },
                })
                } else {
                  router.push({  
                    pathname: "/root/new-post",
                    params: {
                      recipient_id: currentPost?.clerk_id,
                      username: currentPost?.username,
                      source: "board"
                    },
                })
                }
              }}
              />
              {currentPost?.prompt_id && 
                <InteractionButton 
              label="Hard agree"
              icon={icons.check}
              color={"#000000"}
              onPress={async () => {
                
               try {
                  await fetchAPI(`/api/prompts/updateEngagement`, {
                    method: "PATCH",
                    body: JSON.stringify({
                      clerkId: user?.id,
                      promptId: currentPost?.prompt_id
                    }),
                  });
                } catch (error) {
                  console.error("Failed to update:", error);
                } finally {
                  handleInteractionPress("🤩")
                  const timeoutId = setTimeout(() => {
                  setCurrentPostIndex((prevIndex) => {
                    const newIndex = prevIndex + 1;
                    if (newIndex < 0) {
                      return posts.length - 1; // Loop back to the last post
                    } else if (newIndex >= posts.length) {
                      return 0; // Loop back to the first post
                    }
                    return newIndex;
                  }
                  );
                  translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
                  opacity.value = withTiming(0, {}, () => {
                    runOnJS(setCurrentPostIndex)(currentPostIndex + 1);
                    opacity.value = withTiming(1);
                  }
                  );
                  if (soundEffectsEnabled) {
                    //playSoundEffect(SoundType.Dislike);
                  }
                }, 2000)

                return () => clearTimeout(timeoutId);

                }
              
              }}
              />}

            </View>
           ) : (<View className="absolute top-[80%] self-center flex flex-row">
            {posts.length > 1 &&
              posts.map((post, index) => {
                return (
                  <CarrouselIndicator
                    key={post.id}
                    id={index}
                    index={currentPostIndex}
                  />
                );
              })}
          </View>)}
        
        </AnimatedView>
        {!!selectedEmoji && 
          
          
          <View className="absolute -top-[150px] self-center inset-0">
            <EmojiExplosionModal
              isVisible={!!selectedEmoji}
              verticalForce={50}
              radius={800}
              emojiSize="text-[150px]"
              duration={8000}
              emoji={selectedEmoji}
              onComplete={() => {
                setSelectedEmoji("")
                console.log("done")
              }}
            />
          </View>
          }
        
      </ReactNativeModal>
  );
};

export default PostModal;

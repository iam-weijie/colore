import { useGlobalContext } from "@/app/globalcontext";
import { icons, temporaryColors } from "@/constants/index";
import { fetchAPI } from "@/lib/fetch";
import { convertToLocal, formatDateTruncatedMonth } from "@/lib/utils";
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
  Platform,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import ReactNativeModal from "react-native-modal";
import Animated, {
  FadeInUp,
  FadeOutDown,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { captureRef } from "react-native-view-shot";
import DropdownMenu from "./DropdownMenu";

const { width, height } = Dimensions.get("window");

const CarrouselIndicator = ({ id, index }: { id: number; index: number }) => {
  // Shared values for animation
  const width = useSharedValue(2);
  const opacity = useSharedValue(0.5);

  // Animate when `id` or `index` changes
  useEffect(() => {
    if (id === index) {
      width.value = withTiming(50, { duration: 300 }); // Animate width to 50
      opacity.value = withTiming(1, { duration: 300 }); // Animate opacity to 1
    } else {
      width.value = withTiming(8, { duration: 300 }); // Animate width back to 2
      opacity.value = withTiming(0.5, { duration: 300 }); // Animate opacity back to 0.5
    }
  }, [id, index]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: width.value,
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          borderRadius: 999, // Fully rounded corners
          padding: 2,
          minWidth: 8,
          height: 8,
          backgroundColor: "white",
          marginHorizontal: 4,
        },
        animatedStyle, // Apply animated styles
      ]}
    />
  );
};

const PostModal: React.FC<PostModalProps> = ({
  isVisible,
  selectedPost,
  handleCloseModal,
  handleUpdate,
  invertedColors = false,
  header,
}) => {
  const { stacks } = useGlobalContext();
  const { user } = useUser();
  const [nickname, setNickname] = useState<string>("");
  const [currentPostIndex, setCurrentPostIndex] = useState<number>(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isLoadingLike, setIsLoadingLike] = useState<boolean>(false);
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
  }, [selectedPost, stacks]);

  useEffect(() => {
    fetchUserdata();
    fetchLikeStatus();
  }, [isSaved, isLiked, user]);

  useEffect(() => {
    if (post.length) {
      setPosts(post);
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

  // Fetch like status only when post or user changes
  useEffect(() => {
    if (!user?.id || !post[currentPostIndex]?.id) return;
    fetchLikeStatus();
  }, [post, currentPostIndex, user?.id]);

  const dateCreated = convertToLocal(
    new Date(post[currentPostIndex]?.created_at || "")
  );
  const formattedDate = formatDateTruncatedMonth(dateCreated);
  const postColor = temporaryColors.find(
    (color) => color.name === post[currentPostIndex]?.color
  ) as PostItColor;

  // Handle swipe gestures
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      translateX.value = (context.startX as number) + event.translationX;
    },
    onEnd: () => {
      const threshold = 60;
      if (translateX.value > threshold && currentPostIndex > 0) {
        translateX.value = withTiming(0);
        opacity.value = withTiming(0, {}, () => {
          runOnJS(setCurrentPostIndex)(currentPostIndex - 1);
          opacity.value = withTiming(1);
        });
      } else if (
        translateX.value < -threshold &&
        currentPostIndex < posts.length - 1
      ) {
        translateX.value = withTiming(0);
        opacity.value = withTiming(0, {}, () => {
          runOnJS(setCurrentPostIndex)(currentPostIndex + 1);
          opacity.value = withTiming(1);
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    },
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
    if (isLoadingLike || !post[currentPostIndex]?.id || !user?.id) return;
    setIsLoadingLike(true);
    try {
      const increment = !isLiked;
      setIsLiked(increment);
      setLikeCount((prev) => (increment ? prev + 1 : prev - 1));

      const response = await fetchAPI(`/api/posts/updateLikeCount`, {
        method: "PATCH",
        body: JSON.stringify({
          postId: post[currentPostIndex].id,
          userId: user.id,
          increment,
        }),
      });

      if (response.error) {
        setIsLiked(!increment);
        setLikeCount((prev) => (increment ? prev - 1 : prev + 1));
        Alert.alert("Error", "Unable to update like status.");
        return;
      }

      setIsLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
    } catch (error) {
      console.error("Failed to update like status:", error);
    } finally {
      setIsLoadingLike(false);
      handleUpdate();
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
      return findUserNickname(nicknames, post!.clerk_id) === -1
        ? ""
        : nicknames[findUserNickname(nicknames, post!.clerk_id)][1];
    } catch (error) {
      console.error("Failed to fetch user data:", error);
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
      const savedStatus = savePostsList.includes(
        `${post[currentPostIndex]?.id}`
      );
      setSavedPosts(savePostsList);
      setIsSaved(savedStatus);
    } catch (error) {
      console.error("Failed to fetch user data", error);
    }
  };

  const handleDeletePress = async () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel" },
      { text: "Delete", onPress: handleDelete },
    ]);
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
        pathname: "/root/edit-post",
        params: {
          postId: post[currentPostIndex]?.id,
          content: post[currentPostIndex]?.content,
          color: post[currentPostIndex]?.color,
          emoji: post[currentPostIndex]?.emoji,
        },
      });
    }, 750);
  };

  const handleDelete = async () => {
    try {
      const response = await fetchAPI(
        `/api/posts/deletePost?id=${post[currentPostIndex]!.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.error) {
        throw new Error(response.error);
      }

      Alert.alert("Post deleted successfully");
      handleCloseModal();

      if (typeof handleUpdate === "function") {
        // call only if defined (aka refresh needed after deleting post)
        await handleUpdate();
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      Alert.alert("Error", "Failed to delete post. Please try again.");
    }
  };

  const handleCommentsPress = () => {
    handleCloseModal();
    router.push({
      pathname: "/root/post/[id]",
      params: {
        id: post[currentPostIndex]?.id,
        clerk_id: post[currentPostIndex]?.clerk_id,
        content: post[currentPostIndex]?.content,
        username: post[currentPostIndex]?.username,
        like_count: post[currentPostIndex]?.like_count,
        report_count: post[currentPostIndex]?.report_count,
        created_at: post[currentPostIndex]?.created_at,
        unread_comments: post[currentPostIndex]?.unread_comments,
        anonymous: invertedColors,
        color: post[currentPostIndex]?.color,
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
      handleUpdate();
    }
  };

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
          console.log(x, y, width, height);
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
        message: `${post[currentPostIndex]?.content.trim()} \n\nHere’s something interesting:https://testflight.apple.com/join/edtGfSAT`,
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
          postId: post[currentPostIndex]?.id,
          pinnedStatus: !isPinned,
        }),
      });
    } catch (error) {
      console.error("Failed to update handlepin message:", error);
    } finally {
      setIsPinned((prevIsPinned) => !prevIsPinned);
      handleUpdate();
    }
  };

  useEffect(() => {
    if (imageUri) {
      console.log("Image URI has been set:", imageUri);
    }
  }, [imageUri]);

  // COMPONENT RENDER

  const BackgroundGridEmoji = (emoji: string) => {
    const GRID_SIZE = 100; // Size of each square in the grid
    const OFFSET_X = 20; // Offset for odd rows
    const ITEMS_PER_ROW = 4; // Number of items per row
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
    if (invertedColors) {
      return [
        {
          label: isPinned ? "Unpin" : "Pin",
          source: icons.pin,
          color: "rgba(180,180,180,0.95)",
          onPress: handlePin,
        },
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
          label: "Delete",
          source: icons.trash,
          color: "#DA0808",
          onPress: handleDeletePress,
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
            onPress: () => handleSavePost(post[currentPostIndex]?.id),
          },
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
            onPress: () => handleSavePost(post[currentPostIndex]?.id),
          },
          {
            label: "Report",
            source: icons.email,
            color: "#DA0808",
            onPress: handleReportPress,
          },
        ];
  };

  return (
    <GestureHandlerRootView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <ReactNativeModal
        isVisible={isVisible}
        backdropColor={"rgba(0,0,0,0)"}
        backdropOpacity={1}
        onBackdropPress={handleCloseModal}
      >
        <View
          ref={viewRef}
          className="flex-1 absolute w-screen h-screen  -ml-5 align-items justify-center z-[10]"
          style={{
            backgroundColor: postColor?.hex || "rgba(0, 0, 0, 0.5)",
          }}
        >
          <TouchableWithoutFeedback onPress={handleCloseModal}>
            {BackgroundGridEmoji(post[currentPostIndex]?.emoji || "")}
          </TouchableWithoutFeedback>

          {header}

          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View
              entering={FadeInUp.duration(400)}
              exiting={FadeOutDown.duration(250)}
              className="bg-white px-6 py-4 rounded-[20px] min-h-[200px] max-h-[40%] w-[80%] mx-auto"
              style={[
                animatedStyle,
                {
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
                  {post[currentPostIndex]?.content}
                </Text>
              </ScrollView>
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
                  {post && post.clerk_id === user?.id && (
                    <Text className="ml-1 text-gray-600">{likeCount}</Text>
                  )}
                </View>
                {/* Delete button for post owner */}
                {
                  <DropdownMenu
                    menuItems={getMenuItems(
                      post[currentPostIndex]?.clerk_id === user!.id ||
                        post[currentPostIndex]?.recipient_user_id === user!.id,
                      invertedColors
                    )}
                  />
                }
              </View>
            </Animated.View>
          </PanGestureHandler>
          <View className="absolute top-[80%] self-center flex flex-row">
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
          </View>
        </View>
      </ReactNativeModal>
    </GestureHandlerRootView>
  );
};

export default PostModal;

import React, { useEffect, useState, useMemo } from "react";
import { useGlobalContext } from "@/app/globalcontext";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  FadeInUp,
  FadeOutDown,
  runOnJS,
} from "react-native-reanimated";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import ReactNativeModal from "react-native-modal";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import { convertToLocal, formatDateTruncatedMonth } from "@/lib/utils";
import {
  Post,
  PostItColor,
  PostModalProps,
  UserNicknamePair,
} from "@/types/type";
import { icons, temporaryColors } from "@/constants/index";
import DropdownMenu from "./DropdownMenu";
import * as Linking from "expo-linking";
import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");


const PostModal: React.FC<PostModalProps> = ({
  isVisible,
  selectedPost,
  handleCloseModal,
  handleUpdate,
  invertedColors = false,
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

  // Memoize the posts array to prevent unnecessary re-renders
  const post = useMemo(() => {
    const stack = stacks.find((stack) => stack.ids.includes(selectedPost.id));
    return stack ? stack.elements : [selectedPost];
  }, [selectedPost, stacks]);

  useEffect(() => {
    if (post.length) {
      setPosts(post);
    }
  }, [post]);

  // Fetch like status only when post or user changes
  useEffect(() => {
    if (!user?.id || !post[currentPostIndex]?.id) return;

    const fetchLikeStatus = async () => {
      try {
        const response = await fetchAPI(
          `/api/posts/updateLikeCount?postId=${post[currentPostIndex].id}&userId=${user.id}`,
          { method: "GET" }
        );
        if (response.error) return;

        setIsLiked(response.data.liked);
        setLikeCount(response.data.likeCount);
      } catch (error) {
        console.error("Failed to fetch like status:", error);
      }
    };

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

    try {
      setIsLoadingLike(true);
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
      const data = await fetchCurrentNickname();
      setNickname(data);
    };
    getData();
  }, [user]);

  const handleDeletePress = async () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel" },
      { text: "Delete", onPress: handleDelete },
    ]);
  };

  const handleReportPress = () => {
    Linking.openURL("mailto:support@colore.ca");
  };

  const handleDelete = async () => {
    try {
      const response = await fetchAPI(`/api/posts/deletePost?id=${post!.id}`, {
        method: "DELETE",
      });

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
        firstname: post[currentPostIndex]?.firstname,
        username: post[currentPostIndex]?.username,
        like_count: post[currentPostIndex]?.like_count,
        report_count: post[currentPostIndex]?.report_count,
        created_at: post[currentPostIndex]?.created_at,
        unread_comments: post[currentPostIndex]?.unread_comments,
      },
    });
  };

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
        y: row * GRID_SIZE
      });
    }
  }

  return (
    <View className="absolute w-full h-full -ml-2">
      {gridItems.map((item, index) => (
        <View
          key={index}
          className="absolute align-center justify-center"  
          style={{ left: item.x, top: item.y, width: GRID_SIZE, height: GRID_SIZE }}  
        >
          <Text style={{fontSize: 50}}>{emoji}</Text>
        </View>
      ))}
    </View>
  );
};
  

  return (
    <ReactNativeModal
      isVisible={isVisible}
      backdropColor={(postColor?.hex || "rgba(0,0,0,0.5)")}
      backdropOpacity={1}
      onBackdropPress={handleCloseModal}
    >
      <TouchableWithoutFeedback onPress={handleCloseModal}>
      {BackgroundGridEmoji(post[currentPostIndex]?.emoji || "")}
      </TouchableWithoutFeedback>

      <GestureHandlerRootView
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View
            entering={FadeInUp.duration(400)}
            exiting={FadeOutDown.duration(250)}
            className="bg-white px-6 py-4 rounded-2xl min-h-[200px] max-h-[70%] w-[90%] mx-auto"
            style={[
              animatedStyle,
              {
                backgroundColor:  "rgba(255, 255, 255, 1)"
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
                <TouchableOpacity
                  onPress={handleLikePress}
                  disabled={isLoadingLike}
                  className="ml-2"
                >
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
              {post && post.clerk_id === user?.id ? (
                <DropdownMenu
                  menuItems={[{ label: "Delete", onPress: handleDeletePress }]}
                />
              ) : (
                <DropdownMenu
                  menuItems={[{ label: "Report", onPress: handleReportPress }]}
                />
              )}
            </View>
          </Animated.View>
        </PanGestureHandler>
      </GestureHandlerRootView>
    </ReactNativeModal>
  );
};

export default PostModal;
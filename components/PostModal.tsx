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
  runOnJS
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
import { GestureHandlerRootView, PanGestureHandler } from "react-native-gesture-handler";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import { convertToLocal, formatDateTruncatedMonth } from "@/lib/utils";
import { Post, PostItColor, PostModalProps } from "@/types/type";
import { icons, temporaryColors } from "@/constants/index";

const PostModal: React.FC<PostModalProps> = ({
  isVisible,
  selectedPost,
  handleCloseModal,
  handleUpdate,
}) => {
  const { stacks } = useGlobalContext();
  const { user } = useUser();
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

  const dateCreated = convertToLocal(new Date(post[currentPostIndex]?.created_at || ""));
  const formattedDate = formatDateTruncatedMonth(dateCreated);
  const postColor = temporaryColors.find((color) => color.name === post[currentPostIndex]?.color) as PostItColor;

  // Handle swipe gestures
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
    },
    onEnd: () => {
      const threshold = 60;
      if (translateX.value > threshold && currentPostIndex > 0) {
        translateX.value = withTiming(0);
        opacity.value = withTiming(0, {}, () => {
          runOnJS(setCurrentPostIndex)(currentPostIndex - 1);
          opacity.value = withTiming(1);
        });
      } else if (translateX.value < -threshold && currentPostIndex < posts.length - 1) {
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
    transform: [{ translateX: withSpring(translateX.value, { damping: 20, stiffness: 300 }) }],
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
        body: JSON.stringify({ postId: post[currentPostIndex].id, userId: user.id, increment }),
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

  return (
    <ReactNativeModal
      isVisible={isVisible}
      backdropColor={postColor?.hex || "rgba(0,0,0,0.5)"}
      backdropOpacity={1}
      onBackdropPress={handleCloseModal}
    >
      <TouchableWithoutFeedback onPress={handleCloseModal}>
        <View />
      </TouchableWithoutFeedback>

      <GestureHandlerRootView style={{ justifyContent: "center", alignItems: "center" }}>
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View
            entering={FadeInUp.duration(400)}
            exiting={FadeOutDown.duration(250)}
            className="bg-white px-6 py-4 rounded-2xl min-h-[200px] max-h-[70%] w-[90%] mx-auto"
            style={[animatedStyle]}
          >
            <TouchableOpacity onPress={handleCloseModal}>
              <Image source={icons.close} style={{ width: 24, height: 24, alignSelf: "flex-end" }} />
            </TouchableOpacity>

            <ScrollView>
              <Text style={{ fontSize: 16, marginVertical: 16 }}>{post[currentPostIndex]?.content}</Text>
            </ScrollView>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <Animated.View entering={FadeInUp.duration(200)} className="flex-flex flex-row">
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
              </Animated.View>
              <Text>{formattedDate}</Text>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </GestureHandlerRootView>
    </ReactNativeModal>
  );
};

export default PostModal;

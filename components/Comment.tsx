import { useEffect, useState } from "react";
import { icons } from "@/constants/index";
import { fetchAPI } from "@/lib/fetch";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { PostComment } from "@/types/type";
import * as Linking from "expo-linking";
import { useGlobalContext } from "@/app/globalcontext";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects"; // Import sound hook
import { useSoundGesture } from "@/hooks/useSoundGesture";
import { formatNumber } from "@/lib/utils";
import {
    useRouter,
  } from "expo-router";
import {
    Alert,
    Image,
    Text,
    TouchableOpacity,
    View,
  } from "react-native";
  import {
    GestureHandlerRootView,
    PanGestureHandler,
    PanGestureHandlerGestureEvent,
  } from "react-native-gesture-handler";
  import Animated, {
    BounceIn,
    FadeIn,
    runOnJS,
    SlideInLeft,
    SlideInRight,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
  } from "react-native-reanimated";
import React from "react";
import { isOnlyEmoji } from "@/lib/post";

export const CommentItem: React.FC<PostComment> = ({
    id,
    post_id,
    user_id,
    sender_id,
    index,
    content,
    username,
    created_at,
    like_count,
    is_liked,
    postColor,
    reply_comment_id
  }) => {
    const { user } = useUser();
    const router = useRouter();
    const [showReplyIcon, setShowReplyIcon] = useState(false);
    const [replyingTo, setReplyingTo] = useState<PostComment | null>(null);
    const { replyTo, setReplyTo, setScrollTo, soundEffectsEnabled } = useGlobalContext() // Add soundEffectsEnabled
    const [onlyEmoji, setOnlyEmoji] = useState(false);
    const { playSoundEffect } = useSoundEffects(); // Get sound function
    const { handlePanGestureStateChange } = useSoundGesture(SoundType.Swipe);


    // Comment Reply
    const fetchCommentById = async (ids: string) => {
        try {
          const response = await fetchAPI(`/api/comments/getCommentsById?id=${reply_comment_id}`);

          setReplyingTo(response.data[0] || null); // Return null if no post is found
        } catch (error) {
          return null;
        }
      };
    // Comment like constant
    const [tapCount, setTapCount] = useState(0);
    const [isLoadingLike, setIsLoadingLike] = useState<boolean>(false);
    const [replyId, setReplyId] = useState<string>("");
    const [isLiked, setIsLiked] = useState<boolean>(is_liked);
    const [likeCount, setLikeCount] = useState<number>(like_count);
    const [commentLikes, setCommentLikes] = useState<{ [key: string]: boolean }>(
      {}
    );
    const [commentLikeCounts, setCommentLikeCounts] = useState<{
      [key: string]: number;
    }>({});
    const [isLoadingCommentLike, setIsLoadingCommentLike] =
      useState<boolean>(false);

    // Report Logic
    const handleReportPress = () => {
      Alert.alert(
        "Report Comment",
        "Are you sure you want to report this comment?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Report",
            onPress: () => Linking.openURL("mailto:support@colore.ca"),
          },
        ]
      );
    };

    // Comment Like Logic
    const handleCommentLike = async (commentId: number) => {
      if (!user || isLoadingCommentLike) return;

      try {
        // Play like sound if liking (not unliking) and enabled
        if (!commentLikes[commentId] && soundEffectsEnabled) {
          playSoundEffect(SoundType.Like);
        }
        setIsLoadingCommentLike(true);
        const isCurrentlyLiked = commentLikes[commentId];

        // Optimistic update
        setCommentLikes((prev) => ({ ...prev, [commentId]: !isCurrentlyLiked }));
        setCommentLikeCounts((prev) => ({
          ...prev,
          [commentId]: prev[commentId] + (isCurrentlyLiked ? -1 : 1),
        }));

        const response = await fetchAPI("/api/comments/updateCommentLike", {
          method: "PATCH",
          body: JSON.stringify({
            commentId,
            userId: user.id,
            increment: !isCurrentlyLiked,
          }),
        });

        if (response.error) {
          // Revert optimistic update
          setCommentLikes((prev) => ({ ...prev, [commentId]: isCurrentlyLiked }));
          setCommentLikeCounts((prev) => ({
            ...prev,
            [commentId]: prev[commentId] + (isCurrentlyLiked ? 1 : -1),
          }));
          Alert.alert("Error", "Unable to update like state");
          return;
        }

        // Update with server values
        setCommentLikes((prev) => ({
          ...prev,
          [commentId]: response.data.liked,
        }));
        setCommentLikeCounts((prev) => ({
          ...prev,
          [commentId]: response.data.likeCount,
        }));
        setIsLiked(response.data.liked);
        setLikeCount(response.data.likeCount);
      } catch (error) {
        console.error("Failed to update comment like:", error);
        // Revert optimistic update on error
        const isCurrentlyLiked = commentLikes[commentId];
        setCommentLikes((prev) => ({ ...prev, [commentId]: isCurrentlyLiked }));
        setCommentLikeCounts((prev) => ({
          ...prev,
          [commentId]: prev[commentId] + (isCurrentlyLiked ? 1 : -1),
        }));
      } finally {
        setIsLoadingCommentLike(false);
      }
    };

    const translateX = useSharedValue(0);

    // Maximum swipe distance
    const maxSwipe = user_id != user!.id ? 30 : 0; // Adjust as needed
    const minSwipe = user_id == user!.id ?  -30 : 0; // Adjust as needed


    const gestureHandler = useAnimatedGestureHandler<
      PanGestureHandlerGestureEvent,
      GestureContext
    >({
      onStart: (_, context) => {
        context.startX = translateX.value;
        // Add sound effect on gesture start - safely
        try {
          runOnJS(handlePanGestureStateChange)({ nativeEvent: { state: 1 } });
        } catch (error) {
          console.log("Error playing swipe start sound:", error);
        }
      },
      onActive: (event, context) => {
        // Calculate the translation, limit swipe range
        const translationX = context.startX + event.translationX;
        translateX.value = Math.max(Math.min(translationX, maxSwipe), minSwipe);

        if (Math.abs(translateX.value) > 5) {
        runOnJS(setShowReplyIcon)(true)
        }
      },
      onEnd: () => {
        runOnJS(setShowReplyIcon)(false);
        const offSetX = translateX.value;
        
        // Add sound effect on gesture end - safely
        try {
          runOnJS(handlePanGestureStateChange)({ nativeEvent: { state: 5 } });
        } catch (error) {
          console.log("Error playing swipe end sound:", error);
        }
        
        if (Math.abs(offSetX) > 30) {
          if (replyTo == `${id}`) {
            runOnJS(setReplyTo)(null);
          } else {
            runOnJS(setReplyTo)(`${id}`);
          }
        }
        translateX.value = withTiming(0, { duration: 300 }); // Use `withTiming` to reset smoothly
      },
    });



    const doubleTapHandler = () => {
      setTapCount((prevCount) => prevCount + 1);
    };

    useEffect(() => {
      if (tapCount === 2) {
        // Handle double-tap
        handleCommentLike(id);
        setTapCount(0); // Reset tap count
      }
    }, [tapCount]);

    useEffect(() => {
        if (reply_comment_id) {
            fetchCommentById(reply_comment_id.toString())
        }
    }, [])

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateX: withSpring(translateX.value, {
            damping: 20,
            stiffness: 300,
          }),
        },
      ],
    }));

    useEffect(() => {
      if (content) {
        setOnlyEmoji(isOnlyEmoji(content));
      }
    }, [content]);
    return (
      <GestureHandlerRootView
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View
          entering={user_id === user?.id ? SlideInRight.stiffness(50) : SlideInLeft.stiffness(50)}
            className="flex flex-col justify-center"
            style={[
              animatedStyle, {
                alignSelf: user_id === user?.id ? "flex-end" : "flex-start",
                alignItems: user_id === user?.id ? "flex-end" : "flex-start",
              }
            ]}
          >
            {username && <View
              className="text-[12px] text-tray-400 font-JakartaMedium mt-4"
              style={{
                [user_id === user?.id ? "right" : "left"]: 5,
                alignSelf: user_id === user?.id ? "flex-end" : "flex-start",
              }}
            >
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => {
                  router.push({
                    pathname: "/root/profile/[id]",
                    params: { userId: user_id, username: username },
                  });
                }}
              >
                <Text className="font-JakartaMedium text-[12px] text-tray-400">{username}</Text>
              </TouchableOpacity>
            </View>}
            { replyingTo &&
            <View
            className="max-w-[70%]"
              style={{
                marginTop: 8,
                alignSelf: user_id === user?.id ? "flex-end" : "flex-start",
                }}>
                <TouchableOpacity
                onPress={() => {setScrollTo(`${replyingTo.id}`)}}>
                <View 
                className="flex flex-row rounded-[24px] py-3 px-4"
                style={{
                  backgroundColor: replyingTo.sender_id == user_id
                      ? postColor
                      : "#e5e7eb",
                      opacity: 0.6
                }}
                >
                    <Text 
                    className="ml-1 text-[14px] italic"
                    style={{
                        color: replyingTo.sender_id == user_id ? "white" : "black"
                    }}
                    numberOfLines={4}
                    >
                        {replyingTo!.content}
                    </Text>
                    </View>
                    </TouchableOpacity>
                </View>
                }
            <View
            className="py-3 px-4 rounded-[24px] max-w-[70%]"
            style={{
              backgroundColor:
              onlyEmoji ? "rgba(0,0,0,0)" : (user_id === user?.id
                ? "black"
                : user_id == sender_id
                  ? postColor
                  : "#EEEEEE"),

            marginTop:  onlyEmoji ? -6 : 6,
            }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                doubleTapHandler();
              }}
              onLongPress={() => {
                if (user_id === user!.id) {
                Alert.alert(
                  "Delete Comment",
                  "Are you sure you want to delete this comment?",
                  [
                    { text: "Cancel" },
                    { text: "Delete", onPress: async () => {
                      try {
                        await fetchAPI(`/api/comments/deleteComment?id=${id}`, {
                          method: "DELETE",
                        });

                        Alert.alert("Comment deleted.");
                        setScrollTo(`${id - 1}`)
                      } catch (error) {
                        Alert.alert("Error", "Failed to delete comment.");
                        console.error("Failed to delete comment:", error);
                      }
                    }},
                  ]
                );
              } else {
                Alert.alert(
                  "Report Comment",
                  "Are you sure you want to report this comment?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Report",
                      onPress: () => Linking.openURL("mailto:support@colore.ca"),
                    },
                  ]
                );
              }
            }
            
            }
              hitSlop={5}
            >
              <Text
                className="font-JakartaMedium text-[14px]"
                style={{ fontSize: onlyEmoji ? 50 : 12, color: user_id === user?.id ? "white" : "black" }}
              >
                {content}
              </Text>
            </TouchableOpacity>
            <View
              className="absolute flex flex-row items-center"
              style={{
                alignSelf: user_id === user?.id ? "flex-start" : "flex-end",
                [user_id === user?.id ? "left" : "right"]:
                  user_id !== user!.id ? -32 : -16,
                top: "60%",
              }}
            >
              {/* Only show like count to post creator */}
              <Text
                className={`${user_id === user?.id ? "text-gray-600" : "text-transparent"} text-center`}
              >
                {(user_id === user?.id ? likeCount : "0") != "0" ? formatNumber(likeCount) : ""}
              </Text>
              {user_id !== user!.id && (
                <TouchableOpacity
                  onPress={async () => {
                    await handleCommentLike(id);
                  }}
                  disabled={isLoadingLike}
                >
                  {isLiked && (
                    <MaterialCommunityIcons
                      name={isLiked ? "heart" : "heart-outline"}
                      size={20}
                      color={isLiked ? "red" : "black"}
                    />
                  )}
                </TouchableOpacity>
              )}
            </View>
            </View>


            {showReplyIcon && (
              <View
                style={{
                  alignSelf: user_id == user?.id ? "flex-end" : "flex-start",
                  [user_id === user?.id ? "right" : "left"]: -40,
                  bottom: 0,
                }}
                className="absolute"
              >
               <Text className="text-grey-300 text-xs font-Jakarta">{replyTo == `${id}` ? `Cancel` : `Reply`}</Text>
              </View>
            )}
          </Animated.View>
        </PanGestureHandler>
      </GestureHandlerRootView>
    );
  };
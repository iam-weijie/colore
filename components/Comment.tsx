import React, { useEffect, useState, memo } from "react";
import { Alert, Text, TouchableOpacity, View, TextStyle } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  SlideInLeft,
  SlideInRight,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { PostComment } from "@/types/type";
import { fetchAPI } from "@/lib/fetch";
import { formatNumber } from "@/lib/utils";
import { isOnlyEmoji } from "@/lib/post";
import { useReplyScroll } from "@/app/contexts/ReplyScrollContext";
import { useSettingsContext } from "@/app/contexts/SettingsContext";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects";
import { useSoundGesture } from "@/hooks/useSoundGesture";

type GestureContext = { startX: number };

const CommentItemInner: React.FC<PostComment> = ({
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
  reply_comment_id,
}) => {
  const { user } = useUser();
  const router = useRouter();

  const { replyTo, setReplyTo, setScrollTo } = useReplyScroll();
  const { soundEffectsEnabled } = useSettingsContext();
  const { playSoundEffect } = useSoundEffects();
  const { handlePanGestureStateChange } = useSoundGesture(SoundType.Swipe);

  const [replyingTo, setReplyingTo] = useState<PostComment | null>(null);
  const [onlyEmoji, setOnlyEmoji] = useState<boolean>(false);

  const [isLiked, setIsLiked] = useState<boolean>(!!is_liked);
  const [likeCount, setLikeCount] = useState<number>(like_count ?? 0);
  const [isLoadingCommentLike, setIsLoadingCommentLike] = useState<boolean>(false);

  // Double tap (kept simple; could be a TapGestureHandler if you want zero React updates)
  const [tapCount, setTapCount] = useState(0);
  const doubleTapHandler = () => setTapCount((c) => c + 1);
  useEffect(() => {
    if (tapCount === 2) {
      handleCommentLike(id);
      setTapCount(0);
    }
  }, [tapCount]);

  // Parent reply fetch (unchanged API)
  const fetchCommentById = async (ids: string) => {
    try {
      const response = await fetchAPI(`/api/comments/getCommentsById?id=${reply_comment_id}`);
      setReplyingTo(response.data?.[0] || null);
    } catch {
      setReplyingTo(null);
    }
  };
  useEffect(() => {
    if (reply_comment_id) fetchCommentById(String(reply_comment_id));
  }, [reply_comment_id]);

  useEffect(() => {
    setOnlyEmoji(Boolean(content && isOnlyEmoji(content)));
  }, [content]);

  // Like API (unchanged)
  const handleCommentLike = async (commentId: number) => {
    if (!user || isLoadingCommentLike) return;
    const wasLiked = isLiked;

    try {
      if (!wasLiked && soundEffectsEnabled) playSoundEffect(SoundType.Like);
      setIsLoadingCommentLike(true);
      // optimistic
      setIsLiked(!wasLiked);
      setLikeCount((c) => c + (wasLiked ? -1 : 1));

      const response = await fetchAPI("/api/comments/updateCommentLike", {
        method: "PATCH",
        body: JSON.stringify({
          commentId,
          userId: user.id,
          increment: !wasLiked,
        }),
      });

      if (response?.error) {
        setIsLiked(wasLiked);
        setLikeCount((c) => c + (wasLiked ? 1 : -1));
        Alert.alert("Error", "Unable to update like state");
        return;
      }

      setIsLiked(!!response.data?.liked);
      setLikeCount(response.data?.likeCount ?? 0);
    } catch {
      setIsLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    } finally {
      setIsLoadingCommentLike(false);
    }
  };

  // Swipe-to-reply: NO React state here -> zero re-renders while swiping
  const translateX = useSharedValue(0);
  const isSelf = user_id === user?.id;
  const maxSwipe = !isSelf ? 40 : 0;
  const minSwipe = isSelf ? -40 : 0;

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    GestureContext
  >({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      try {
        runOnJS(handlePanGestureStateChange)({ nativeEvent: { state: 1 } });
      } catch {}
    },
    onActive: (event, ctx) => {
      const tx = ctx.startX + event.translationX;
      translateX.value = Math.max(Math.min(tx, maxSwipe), minSwipe);
    },
    onEnd: () => {
      const offsetX = translateX.value;
      try {
        runOnJS(handlePanGestureStateChange)({ nativeEvent: { state: 5 } });
      } catch {}

      if (Math.abs(offsetX) >= 30) {
        if (replyTo === String(id)) runOnJS(setReplyTo)(null);
        else runOnJS(setReplyTo)(String(id));
      }
      translateX.value = withTiming(0, { duration: 300 });
    },
  });

  // wrapper handles entering (kept), inner handles pan translateX only
  const wrapperEntering = (isSelf ? SlideInRight : SlideInLeft).stiffness(50);

  const panStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(translateX.value, { damping: 20, stiffness: 300 }) }],
  }));

  // animated “Reply” hint, no React state
  const showReply = useDerivedValue(() => (Math.abs(translateX.value) > 5 ? 1 : 0));
  const replyHintStyle = useAnimatedStyle(() => ({
    opacity: withTiming(showReply.value, { duration: 120 }),
  }));

  // colors
  const bubbleBg = onlyEmoji
    ? "transparent"
    : isSelf
    ? "black"
    : user_id === sender_id
    ? (postColor as string)
    : "#EEEEEE";
  const textColor: TextStyle["color"] = onlyEmoji ? "black" : isSelf ? "white" : "black";
  const replyBg =
    replyingTo && replyingTo.sender_id === user_id ? (postColor as string) : "#e5e7eb";

  return (
    // Do NOT center here; make wrapper full width so start/end alignment works
    <GestureHandlerRootView className="w-full">
      <Animated.View
        entering={wrapperEntering}
        className={`w-full flex flex-col ${isSelf ? "items-end" : "items-start"}`}
      >
        <PanGestureHandler
          onGestureEvent={gestureHandler}
          activeOffsetX={[-15, 15]}
          failOffsetY={[-5, 5]}
        >
          <Animated.View style={panStyle} className="w-auto">
            {/* Username */}
            {username ? (
              <View className={`${isSelf ? "self-end pr-[5px]" : "self-start pl-[5px]"}`}>
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() =>
                  {
                    if (isSelf) return;
                    router.push({
                      pathname: "/root/profile/[id]",
                      params: { userId: user_id, username },
                    })
                  }
                  }
                >
                  <Text className="font-JakartaMedium text-[12px] text-tray-400">{username}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Replying to preview */}
            {replyingTo ? (
              <View className={`mt-2 max-w-[70%] ${isSelf ? "self-end" : "self-start"}`}>
                <TouchableOpacity onPress={() => setScrollTo(String(replyingTo.id))} activeOpacity={0.75}>
                  <View className="flex-row rounded-[24px] px-4 py-3 opacity-60" style={{ backgroundColor: replyBg }}>
                    <Text
                      className="ml-1 italic"
                      numberOfLines={4}
                      style={{ color: replyingTo.sender_id === user_id ? "white" : "black" }}
                    >
                      {replyingTo.content}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Main bubble */}
            <View
              className={`max-w-[70%] rounded-[24px] px-4 py-3 ${onlyEmoji ? "bg-transparent" : ""} ${
                isSelf ? "self-end" : "self-start"
              }`}
              style={{ backgroundColor: bubbleBg, marginTop: onlyEmoji ? -6 : 6 }}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={doubleTapHandler}
                onLongPress={() => {
                  if (user_id === user?.id) {
                    Alert.alert("Delete Comment", "Are you sure you want to delete this comment?", [
                      { text: "Cancel" },
                      {
                        text: "Delete",
                        onPress: async () => {
                          await fetchAPI(`/api/comments/deleteComment?id=${id}`, { method: "DELETE" });
                          Alert.alert("Comment deleted.");
                          setScrollTo(String(id - 1));
                        },
                      },
                    ]);
                  } else {
                    Alert.alert("Report Comment", "Are you sure you want to report this comment?", [
                      { text: "Cancel", style: "cancel" },
                      { text: "Report", onPress: () => Linking.openURL("mailto:support@colore.ca") },
                    ]);
                  }
                }}
                hitSlop={5}
              >
                <Text
                  className={`font-JakartaMedium ${onlyEmoji ? "leading-none" : "text-[14px]"}`}
                  style={{ color: textColor, fontSize: onlyEmoji ? 50 : 12 }}
                >
                  {content}
                </Text>
              </TouchableOpacity>

              {/* Like count + heart (heart only when active) */}
              <View
                className={`absolute flex-row items-center ${isSelf ? "self-start" : "self-end"}`}
                style={{ top: "60%", [isSelf ? "left" : "right"]: isSelf ? -16 : -32 }}
              >
                <Text className={`${isSelf ? "text-gray-600" : "text-transparent"} text-center`}>
                  {(isSelf ? likeCount : 0) ? formatNumber(likeCount) : ""}
                </Text>

                {user_id !== user?.id && isLiked && (
                  <TouchableOpacity onPress={() => handleCommentLike(id)} disabled={isLoadingCommentLike}>
                    <MaterialCommunityIcons name="heart" size={20} color="red" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Swipe hint text (animated; no React state) */}
            <Animated.View
              style={replyHintStyle}
              className={`absolute ${isSelf ? "self-end right-[-40px]" : "self-start left-[-40px]"} bottom-0`}
              pointerEvents="none"
            >
              <Text className="font-Jakarta text-grey-300 text-xs">
                {replyTo === String(id) ? "Cancel" : "Reply"}
              </Text>
            </Animated.View>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </GestureHandlerRootView>
  );
};

// Re-render only when these props change
const areEqual = (prev: PostComment, next: PostComment) => {
  return (
    prev.id === next.id &&
    prev.user_id === next.user_id &&
    prev.sender_id === next.sender_id &&
    prev.content === next.content &&
    prev.username === next.username &&
    prev.is_liked === next.is_liked &&
    prev.like_count === next.like_count &&
    prev.postColor === next.postColor &&
    prev.reply_comment_id === next.reply_comment_id
  );
};

export const CommentItem = memo(CommentItemInner, areEqual);

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  Easing,
  FadeInUp,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { BlurView } from "expo-blur";
import { useUser } from "@clerk/clerk-expo";

import { icons } from "@/constants";
import { allColors } from "@/constants/colors";
import { Format, Post, PostContainerProps, PostItColor } from "@/types/type";
import {
  handleReadComments,
  handleShare,
  handlePin,
  handleReportPress,
  handleSavePost as libHandleSavePost,
  fetchLikeStatus as fetchPostLikeStatus,
} from "@/lib/post";
import { fetchAPI } from "@/lib/fetch";
import { useDevice } from "@/app/contexts/DeviceContext";
import { useSettingsContext } from "@/app/contexts/SettingsContext";
import { useAlert } from "@/notifications/AlertContext";
import ModalSheet from "@/components/Modal";
import EmojiExplosionModal from "@/components/EmojiExplosiveModal";
import EmojiBackground from "@/components/EmojiBackground";
import CommentView from "@/app/root/post/[id]";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";

import PostCard from "../post-container/PostCard";
import EmojiSwipeOverlay from "./EmojiSwipeOverlay";
import { useStarringSwipe } from "@/hooks/useStarringSwipe";

const AnimatedView = Animated.createAnimatedComponent(View);

const StarringContainer: React.FC<PostContainerProps> = ({
  selectedPosts,
  handleCloseModal,
  handleUpdate,
  invertedColors = false,
  infiniteScroll = false,
  isPreview = false,
  header,
  scrollToLoad,
}) => {
  const { isIpad } = useDevice();
  const { soundEffectsEnabled } = useSettingsContext(); // reserved; can be used for SFX on decisions
  const { showAlert } = useAlert();
  const { user } = useUser();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [currentPost, setCurrentPost] = useState<Post>();
  const [currentPostIndex, setCurrentPostIndex] = useState<number>(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isLoadingLike, setIsLoadingLike] = useState<boolean>(false);
  const [selectedBoard, setSelectedBoard] = useState<React.ReactNode | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedEmojiBurst, setSelectedEmojiBurst] = useState<string>(""); // for confetti burst

  // ingest posts
  useEffect(() => {
    if (selectedPosts?.length) {
      setPosts(selectedPosts);
      const safeIndex = Math.min(currentPostIndex, selectedPosts.length - 1);
      setCurrentPost(selectedPosts[safeIndex] || selectedPosts[0]);
      setIsLoading(false);
    }
  }, [selectedPosts, currentPostIndex]);

  // like/saved status per post
  useEffect(() => {
    const newPost = posts[currentPostIndex];
    if (!newPost || !user?.id) return;

    setCurrentPost(newPost);
    setIsPinned(!!newPost.pinned);

    (async () => {
      try {
        const status = await fetchPostLikeStatus(newPost.id, user.id);
        setIsLiked(status.isLiked);
        setLikeCount(status.likeCount);
      } catch (err) {
        console.error("Failed to fetch like status:", err);
      }
    })();

    (async () => {
      try {
        const response = await fetchAPI(`/api/users/getUserInfo?id=${user.id}`);
        const savedList: string[] = response.data?.[0]?.saved_posts || [];
        setIsSaved(savedList.includes(String(newPost.id)));
      } catch (err) {
        console.error("Failed to fetch user data", err);
      }
    })();
  }, [posts, currentPostIndex, user?.id]);

  // colors & bg
  const postColor = allColors.find((c) => c.id === currentPost?.color) as PostItColor | undefined;
  const backgroundColor = useSharedValue<string>(
    currentPost ? postColor?.hex || "rgba(0, 0, 0, 0)" : "white"
  );
  const prevColor = useRef(backgroundColor.value);

  useEffect(() => {
    const next = postColor?.hex || "rgba(0, 0, 0, 0)";
    if (prevColor.current !== next) {
      backgroundColor.value = withTiming(next, {
        duration: 300,
        easing: Easing.inOut(Easing.quad),
      });
      prevColor.current = next;
    }
  }, [postColor, backgroundColor]);

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value as any,
  }));

  // swipe hook (right=agree/like, left=disagree) w/ overlay emoji
  const { gesture, cardStyle, overlayProgress, overlayDirection } = useStarringSwipe({
    index: currentPostIndex,
    total: posts.length,
    setIndex: setCurrentPostIndex,
    infiniteScroll,
    onDecision: (direction) => {
      if (!currentPost || !user?.id) return;

      if (direction === 1) {
        // LIKE path
        (async () => {
          try {
            if (!isLiked) setLikeCount((c) => c + 1);
            setIsLiked(true);

            const response = await fetchAPI(`/api/posts/updateLikeCount`, {
              method: "PATCH",
              body: JSON.stringify({
                postId: currentPost.id,
                userId: user.id,
                increment: true,
              }),
            });

            if (response?.error) {
              // revert on error
              setIsLiked(false);
              setLikeCount((c) => Math.max(0, c - 1));
              showAlert({
                title: "Error",
                message: "Unable to like this post.",
                type: "ERROR",
                status: "error",
              });
            } else {
              // burst a happy emoji
              setSelectedEmojiBurst("👌");
              setTimeout(() => setSelectedEmojiBurst(""), 1400);
            }
          } catch (e) {
            console.error("like error:", e);
          }
        })();
      } else {
        // DISAGREE path (left)
        setSelectedEmojiBurst("🤯");
        setTimeout(() => setSelectedEmojiBurst(""), 1400);
      }
    },
    onNearEnd: () => {
      if (infiniteScroll && typeof scrollToLoad === "function") scrollToLoad();
    },
  });

  // menu
  const menuItems = useMemo(() => {
    if (isPreview) return [];
    const isOwner =
      currentPost && (currentPost.user_id === user?.id || currentPost.recipient_user_id === user?.id);

    if (invertedColors) {
      return currentPost?.recipient_user_id === user?.id
        ? [
            {
              label: isPinned ? "Unpin" : "Pin",
              source: icons.pin,
              color: "#000000",
              onPress: () => {
                if (currentPost && user) {
                  handlePin(currentPost, isPinned, user.id);
                  handleUpdate?.(!isPinned);
                  setIsPinned((p) => !p);
                  handleCloseModal?.();
                }
              },
            },
            {
              label: "Share",
              source: icons.send,
              color: postColor?.fontColor || "rgba(0, 0, 0, 0.5)",
              onPress: () => currentPost && handleShare(imageUri, currentPost),
            },
            {
              label: "Delete",
              source: icons.trash,
              color: "#DA0808",
              onPress: () => {
                showAlert({
                  title: "Delete Post",
                  message: "Are you sure you want to delete this post?",
                  type: "DELETE",
                  status: "success",
                  action: async () => {
                    try {
                      const response = await fetchAPI(
                        `/api/posts/deletePost?id=${currentPost?.id}`,
                        { method: "DELETE" }
                      );
                      if (response.error) throw new Error(response.error);
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
              },
            },
          ]
        : [
            {
              label: "Share",
              source: icons.send,
              color: postColor?.fontColor || "rgba(0, 0, 0, 0.5)",
              onPress: () => currentPost && handleShare(imageUri, currentPost),
            },
            {
              label: isSaved ? "Remove" : "Save",
              color: "#000000",
              source: isSaved ? icons.close : icons.bookmark,
              onPress: () => {
                if (currentPost?.id && user) {
                  libHandleSavePost(currentPost.id, isSaved, user.id);
                  setIsSaved((s) => !s);
                }
              },
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
            onPress: () => currentPost && handleShare(imageUri, currentPost),
          },
          {
            label: isSaved ? "Remove" : "Save",
            color: "#000000",
            source: isSaved ? icons.close : icons.bookmark,
            onPress: () => {
              if (currentPost?.id && user) {
                libHandleSavePost(currentPost.id, isSaved, user.id);
                setIsSaved((s) => !s);
              }
            },
          },
          {
            label: "Delete",
            source: icons.trash,
            color: "#DA0808",
            onPress: () => {
              showAlert({
                title: "Delete Post",
                message: "Are you sure you want to delete this post?",
                type: "DELETE",
                status: "success",
                action: async () => {
                  try {
                    const response = await fetchAPI(
                      `/api/posts/deletePost?id=${currentPost?.id}`,
                      { method: "DELETE" }
                    );
                    if (response.error) throw new Error(response.error);
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
            },
          },
        ]
      : [
          {
            label: "Share",
            source: icons.send,
            color: postColor?.fontColor || "rgba(0, 0, 0, 0.5)",
            onPress: () => currentPost && handleShare(imageUri, currentPost),
          },
          {
            label: isSaved ? "Remove" : "Save",
            color: "#000000",
            source: isSaved ? icons.close : icons.bookmark,
            onPress: () => {
              if (currentPost?.id && user) {
                libHandleSavePost(currentPost.id, isSaved, user.id);
                setIsSaved((s) => !s);
              }
            },
          },
          {
            label: "Report",
            source: icons.email,
            color: "#DA0808",
            onPress: handleReportPress,
          },
        ];
  }, [
    isPreview,
    invertedColors,
    currentPost,
    user?.id,
    isSaved,
    isPinned,
    handleUpdate,
    handleCloseModal,
    imageUri,
    postColor?.fontColor,
    showAlert,
  ]);

  // cleanup on blur
  useFocusEffect(
    useCallback(() => {
      return () => {
        setTimeout(() => {
          handleCloseModal?.();
          setSelectedBoard(null);
        }, 250);
      };
    }, [handleCloseModal])
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center w-full h-full">
        <ColoreActivityIndicator paddingType="fullPage" />
      </View>
    );
  }

  const cleanFormatting: Format[] =
    typeof currentPost?.formatting === "string"
      ? JSON.parse(currentPost.formatting)
      : (currentPost?.formatting ?? []);

  return (
    <AnimatedView
      className="flex-1 absolute w-screen h-screen justify-center top-[3%]"
      style={[animatedBackgroundStyle]}
    >
      <TouchableWithoutFeedback onPress={() => handleCloseModal?.()}>
        <View className="absolute flex-1" />
      </TouchableWithoutFeedback>

      {/* Static emoji wallpaper if post has static_emoji */}
      <View className="absolute flex-1 top-0 -left-3">
        {currentPost?.static_emoji && (
          <EmojiBackground emoji={currentPost?.emoji ?? ""} color="" />
        )}
      </View>

      {header}

      {/* Prompt banner */}
      {currentPost?.prompt && !isPreview && (
        <Animated.View
          className="absolute w-full top-[25%] mx-auto flex-row items-center justify-center px-4"
          entering={FadeInUp.duration(200)}
          exiting={FadeOutDown.duration(200)}
        >
          <TouchableOpacity
            className="w-[80%]"
            onPress={() =>
              router.push({
                pathname: "/root/new-post",
                params: { prompt: currentPost?.prompt, promptId: currentPost?.prompt_id },
              })
            }
          >
            {currentPost?.static_emoji ? (
              <BlurView
                intensity={30}
                tint="light"
                className="flex-row items-center justify-center p-4 rounded-[32px] overflow-hidden"
              >
                <Text className="text-center text-lg font-JakartaSemiBold text-white/95">
                  {currentPost?.prompt.trim()}
                </Text>
              </BlurView>
            ) : (
              <View className="flex-row items-center justify-center py-4 px-6 rounded-[32px] overflow-hidden bg-white">
                <Text className="text-center text-[16px] font-JakartaSemiBold leading-6 text-black/80">
                  {currentPost?.prompt.trim()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Card + Swipe */}
      <GestureHandlerRootView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <GestureDetector gesture={gesture}>
          <PostCard
            isIpad={isIpad}
            isPreview={isPreview}
            currentPost={currentPost}
            userId={user?.id}
            formatting={cleanFormatting}
            likeCount={likeCount}
            isLiked={isLiked}
            onClose={() => handleCloseModal?.()}
            onComments={() => {
              if (!currentPost?.id) return;
              setSelectedBoard(
                <CommentView
                  id={String(currentPost.id)}
                  clerkId={currentPost.user_id || ""}
                  likes={""}
                  anonymousParam={false}
                  color={""}
                />
              );
            }}
            onLike={async () => {
              if (isLoadingLike || !currentPost?.id || !user?.id) return;
              setIsLoadingLike(true);
              try {
                const increment = !isLiked;
                setIsLiked(increment);
                setLikeCount((prev) => (increment ? prev + 1 : Math.max(0, prev - 1)));

                const response = await fetchAPI(`/api/posts/updateLikeCount`, {
                  method: "PATCH",
                  body: JSON.stringify({ postId: currentPost.id, userId: user.id, increment }),
                });

                if (response?.error) {
                  setIsLiked(!increment);
                  setLikeCount((prev) => (increment ? Math.max(0, prev - 1) : prev + 1));
                  showAlert({
                    title: "Error",
                    message: "Unable to update like status.",
                    type: "ERROR",
                    status: "error",
                  });
                }
              } finally {
                setIsLoadingLike(false);
              }
            }}
            menuItems={menuItems}
            reanimatedCardStyle={cardStyle}
            isShowCasing={false}
            allowedComments={false}
          />
        </GestureDetector>

        {/* Emoji overlay that reacts live to swipe direction */}
        <EmojiSwipeOverlay progressSV={overlayProgress} directionSV={overlayDirection} />
      </GestureHandlerRootView>

      {/* Burst confetti emoji when a decision is made */}
      {!!selectedEmojiBurst && !currentPost?.static_emoji && (
        <View className="absolute -top-[150px] self-center inset-0">
          <EmojiExplosionModal
            isVisible={!!selectedEmojiBurst}
            verticalForce={50}
            radius={isIpad ? 1200 : 800}
            emojiSize="text-[150px]"
            duration={800}
            emoji={selectedEmojiBurst}
            onComplete={() => setSelectedEmojiBurst("")}
          />
        </View>
      )}

      {/* Comments modal */}
      <ModalSheet
        isVisible={!!selectedBoard}
        title={"Comments"}
        onClose={() => {
          if (currentPost && user) handleReadComments(currentPost, user.id);
          setSelectedBoard(null);
        }}
      >
        <View className="flex-1 h-full">{selectedBoard}</View>
      </ModalSheet>
    </AnimatedView>
  );
};

export default StarringContainer;

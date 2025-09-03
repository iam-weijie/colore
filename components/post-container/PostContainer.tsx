import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { Text, View, TouchableOpacity, TouchableWithoutFeedback, ScrollView, Image } from "react-native";
import Animated, { FadeInUp, FadeOutDown, Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { navigateToPromptPost } from "@/lib/postNavigation";
import * as Linking from "expo-linking";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { captureRef } from "react-native-view-shot";

import { useUser } from "@clerk/clerk-expo";
import { useDevice } from "@/app/contexts/DeviceContext";
import { useSettingsContext } from "@/app/contexts/SettingsContext";
import { useEncryptionContext } from "@/app/contexts/EncryptionContext";
import { useDraftPost } from "@/app/contexts/DraftPostContext";
import { useUserDataContext } from "@/app/contexts/UserDataContext";
import { useDecryptPosts } from "@/hooks/useDecrypt";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects";
import { useAlert } from "@/notifications/AlertContext";

import { fetchAPI } from "@/lib/fetch";
import { convertToLocal, formatDateTruncatedMonth, isValidDate } from "@/lib/utils";
import { handleReadComments, fetchLikeStatus } from "@/lib/post";
import { useAllPostItColors } from "@/hooks/useTheme";
import { icons } from "@/constants";
import ModalSheet from "@/components/Modal";
import CarrouselIndicator from "../CarrouselIndicator";
import EmojiExplosionModal from "../EmojiExplosiveModal";
import EmojiBackground from "../EmojiBackground";
import PostScreen from "@/app/root/post/[id]";

import PostCard from "./PostCard";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useReactions } from "@/hooks/useReactions";
import { buildMenuItems } from "./buildMenuItems";
import { Format, Post, PostContainerProps, PostItColor } from "@/types/type";

const AnimatedView = Animated.createAnimatedComponent(View);

const PostContainer: React.FC<PostContainerProps> = memo((props) => {
  const {
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
    allowedComments = true,
  } = props;

  // contexts
  const { isIpad } = useDevice();
  const { soundEffectsEnabled } = useSettingsContext();
  const { encryptionKey } = useEncryptionContext();
  const { draftPost } = useDraftPost();
  const { user } = useUser();
  const { showAlert } = useAlert();
  const { playSoundEffect } = useSoundEffects();
  const { savedPosts, addSavedPost, removeSavedPost } = useUserDataContext();
  const allColors = useAllPostItColors();

  // decrypt
  const { decryptPosts } = useDecryptPosts({ encryptionKey, debugPrefix: "PostContainer" });

  // state
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [currentPost, setCurrentPost] = useState<Post | undefined>();
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");
  const [isEmojiStatic, setIsEmojiStatic] = useState<boolean>(staticEmoji);
  const [selectedBoard, setSelectedBoard] = useState<React.ReactNode | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [showCard, setShowCard] = useState(false);

  // background anim
  const backgroundColor = useSharedValue("rgba(0,0,0,0)");
  const prevColorRef = useRef<string>("rgba(0,0,0,0.5)");

  // ingest posts
  const incoming = useMemo(() => selectedPosts, [selectedPosts]);

  useEffect(() => {
    if (!incoming?.length) return;
    const valid = incoming.filter((p) => p && typeof p === "object");
    setPosts(valid);

    const safeIndex = Math.min(currentPostIndex, Math.max(0, valid.length - 1));
    const base = valid[safeIndex];
    if (!base) return;

    if (base.recipient_user_id && encryptionKey) {
      try {
        const [processed] = decryptPosts([base]);
        setCurrentPost(processed ?? base);
        setIsEmojiStatic(processed?.static_emoji ?? false);
      } catch {
        setCurrentPost(base);
        setIsEmojiStatic(base?.static_emoji ?? false);
      }
    } else {
      setCurrentPost(base);
      setIsEmojiStatic(base?.static_emoji ?? false);
    }
  }, [incoming, currentPostIndex, encryptionKey, decryptPosts]);

  // when index changes
  useEffect(() => {
    if (!posts.length) return;
    const base = posts[currentPostIndex];
    if (!base) return;

    if (base.recipient_user_id && encryptionKey) {
      try {
        const [processed] = decryptPosts([base]);
        setCurrentPost(processed ?? base);
      } catch {
        setCurrentPost(base);
      }
    } else {
      setCurrentPost(base);
    }

    if (infiniteScroll && typeof scrollToLoad === "function" && currentPostIndex + 1 === posts.length - 1) {
      scrollToLoad();
    }
  }, [currentPostIndex, posts, encryptionKey, decryptPosts, infiniteScroll, scrollToLoad]);

  // saved & like status
  useEffect(() => {
    if (!currentPost) return;
    setIsSaved(savedPosts?.includes(String(currentPost.id)) ?? false);
  }, [currentPost, savedPosts]);

  // Initialize like status from post data
  useEffect(() => {
    if (!currentPost) return;
    setIsLiked(currentPost.isLiked ?? false);
    setLikeCount(currentPost.like_count ?? 0);
  }, [currentPost]);

  // emoji timing
  useEffect(() => {
    const t = setTimeout(() => setSelectedEmoji(posts[currentPostIndex]?.emoji ?? ""), 300);
    return () => clearTimeout(t);
  }, [posts, currentPostIndex]);

  // auto open comments
  useEffect(() => {
    if (!seeComments) return;
    const t = setTimeout(() => handleCommentsPress(), 800);
    return () => clearTimeout(t);
  }, [seeComments]);

  // trigger when top animation (bg/prompt/header) finishes
  useEffect(() => {
    // match duration of your top animation(s)
    const timeout = setTimeout(() => {
      setShowCard(true);
    }, 300); // or 500–600ms if you want to ensure it's after FadeInUp

    return () => clearTimeout(timeout);
  }, [currentPostIndex]); // reset when navigating posts

  // color animate
  const postColor = allColors.find((c) => c.id === currentPost?.color) as PostItColor | undefined;
  useEffect(() => {
    const next = postColor?.hex || "rgba(0, 0, 0, 0.5)";
    if (prevColorRef.current !== next) {
      backgroundColor.value = withTiming(next, { duration: 300, easing: Easing.inOut(Easing.quad) });
      prevColorRef.current = next;
    }
  }, [postColor, backgroundColor]);

  // focus cleanup
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

  // formatting
  const formatting: Format[] = isPreview
    ? (draftPost?.formatting ?? [])
    : typeof currentPost?.formatting === "string"
    ? JSON.parse(currentPost.formatting)
    : (currentPost?.formatting ?? []);

  // date util (kept local for parity)
  const safeConvertToLocal = useCallback((dateString?: string | null) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (!isValidDate(date)) return "";
      return convertToLocal(date);
    } catch {
      return "";
    }
  }, []);
  const formattedDate = useMemo(() => {
    const local = currentPost?.created_at ? safeConvertToLocal(currentPost.created_at) : "";
    return local ? formatDateTruncatedMonth(local) : "";
  }, [currentPost?.created_at, safeConvertToLocal]);

  // swipe (reanimated values are inside the hook)
  const {
    gesture,
    cardStyle,
    isNavigating
  } = useSwipeNavigation({
    index: currentPostIndex,
    setIndex: setCurrentPostIndex,
    total: posts.length,
  });

  // like/save
  const {
    handleLikePress,
    handleSavePostPress,
  } = useReactions({
    currentPost,
    user,
    isLiked,
    setIsLiked,
    likeCount,
    setLikeCount,
    isSaved,
    setIsSaved,
    addSavedPost,
    removeSavedPost,
    soundEffectsEnabled,
    isNavigating,
  });

  // comments
  const handleCommentsPress = useCallback(() => {
    const p = posts[currentPostIndex];
    if (!p) return;
    setSelectedBoard(<PostScreen id={String(p.id)} clerkId={p.user_id} likes={""} anonymousParam={false} color={""} />);
  }, [posts, currentPostIndex]);

  // share capture
  const viewRef = useRef<View>(null);
  const handleCapture = useCallback(async () => {
    if (!viewRef.current) return;
    try {
      const uri = await captureRef(viewRef, { format: "png", quality: 0.8 });
      await (await import("react-native")).Share.share({ url: uri, title: "Check out this post from Colore!" });
    } catch (e) {
      console.error("Error capturing view:", e);
      showAlert({ title: "Error", message: "Failed to share post. Please try again.", type: "ERROR", status: "error" });
    }
  }, [showAlert]);

  // dropdown items
  const menuItems = useMemo(
    () =>
      buildMenuItems({
        isPreview,
        invertedColors,
        currentPost,
        user,
        isSaved,
        onDelete: undefined, // delete handled inside buildMenuItems with callback wiring
        onSaveToggle: () => handleSavePostPress(currentPost?.id),
        onShare: handleCapture,
        onReport: () => Linking.openURL("mailto:support@colore.ca"),
        onPinChange: (didChange) => {
          handleUpdate?.(didChange);
          if (
            currentPost?.recipient_user_id === user?.id ||
            currentPost?.user_id === user?.id
          ) {
            setTimeout(() => router.setParams({ refresh: Date.now().toString() }), 300);
          }
        },
        handleCloseModal,
        showAlert,
        router,
      }),
    [
      isPreview,
      invertedColors,
      currentPost,
      user,
      isSaved,
      handleSavePostPress,
      handleCapture,
      handleUpdate,
      handleCloseModal,
      showAlert,
      router,
    ]
  );

  // animated bg
  const bgStyle = useAnimatedStyle(() => ({ backgroundColor: backgroundColor.value }));

  return (
    <AnimatedView 
    ref={viewRef} 
    className="flex-1 absolute w-screen h-screen justify-center" 
    entering={FadeInUp.duration(300)} style={[bgStyle]}>
      <TouchableWithoutFeedback onPress={() => handleCloseModal?.()}>
        <View className="absolute flex-1 top-0 -ml-3">
          <EmojiBackground emoji={isEmojiStatic ? selectedEmoji : ""} color="" />
        </View>
      </TouchableWithoutFeedback>

      {header}

      {/* Prompt banner */}
      {currentPost?.prompt && !isPreview && (
        <Animated.View
          className="absolute w-full top-[25%] mx-auto flex-row items-center justify-center"
          entering={FadeInUp.duration(200)}
          exiting={FadeOutDown.duration(200)}
        >
          <TouchableOpacity
            className="w-[75%] max-w-[300px]"
            onPress={() =>
              navigateToPromptPost({ 
                prompt: currentPost?.prompt, 
                promptId: currentPost?.prompt_id?.toString() 
              })
            }
          >
            <Text className="text-center text-[18px] font-JakartaSemiBold text-white shadow-md">
              {currentPost?.prompt}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Card */}
      {showCard && (
        <GestureHandlerRootView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <GestureDetector gesture={gesture}>
            <PostCard
              isIpad={isIpad}
              isPreview={isPreview}
              isShowCasing={isShowCasing}
              allowedComments={allowedComments}
              currentPost={currentPost}
              userId={user?.id}
              formatting={formatting}
              likeCount={likeCount}
              isLiked={isLiked}
              onClose={() => handleCloseModal?.()}
              onComments={handleCommentsPress}
              onLike={handleLikePress}
              menuItems={menuItems}
              reanimatedCardStyle={cardStyle}
            />
          </GestureDetector>
        </GestureHandlerRootView>
      )}


      {/* Carousel dots */}
      <View className={`absolute flex flex-row ${isShowCasing ? "top-40 left-8" : "top-16 left-8"}`}>
        {posts.length > 1 &&
          posts.map((p, idx) => (
            <CarrouselIndicator key={p.id} id={idx} index={currentPostIndex} color={"#FFFFFF"} />
          ))}
      </View>

      {/* Emoji Confetti */}
      {!!selectedEmoji && !isEmojiStatic && (
        <View className="absolute -top-[150px] self-center inset-0">
          <EmojiExplosionModal
            isVisible={!!selectedEmoji}
            verticalForce={50}
            radius={isIpad ? 1200 : 800}
            emojiSize="text-[150px]"
            duration={8000}
            emoji={selectedEmoji}
            onComplete={() => setSelectedEmoji("")}
          />
        </View>
      )}

      {/* Comments Modal */}
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
});

export default PostContainer;

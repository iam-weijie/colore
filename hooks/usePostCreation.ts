import { useState, useEffect, useRef } from "react";
import { router } from "expo-router";
import { PostItColor, UserNicknamePair, Format, Post } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { useAlert } from "@/notifications/AlertContext";
import { useDraftPost } from "@/app/contexts/DraftPostContext";
import { useEncryptionContext } from "@/app/contexts/EncryptionContext";
import { useProfileContext } from "@/app/contexts/ProfileContext";
import { useRecentEmojis } from "@/hooks/useRecentEmojis";
import { useEmojiPreferences } from "@/hooks/useEmojiPreferences";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useHaptics } from "@/hooks/useHaptics";
import { handleSubmitPost } from "@/lib/post";
import { PostCreationState, usePostCreationState } from "@/components/new-post/utils";
import { defaultColors } from "@/constants/colors";
import { SoundType } from "@/hooks/useSoundEffects";
import * as Haptics from "expo-haptics";

export const usePostCreation = (initialParams: {
  postId?: string;
  content?: string;
  color?: string;
  emoji?: string;
  recipientId?: string;
  username?: string;
  expiration?: string;
  prompt?: string;
  promptId?: string;
  boardId?: string;
}) => {
  const { playSoundEffect } = useSoundEffects();
  const { user } = useUser();
  const { showAlert } = useAlert();
  const { setDraftPost, draftPost } = useDraftPost();
  const { encryptionKey } = useEncryptionContext();
  const { profile, userColors } = useProfileContext();
  const { recentEmojis, addRecentEmoji } = useRecentEmojis();
  const { shorthandEmojis } = useEmojiPreferences();
  
  const params = usePostCreationState(initialParams);
  
  // State management
  const [selectedUser, setSelectedUser] = useState<UserNicknamePair>();
  const [userUsername, setUserUsername] = useState<string>(params.username);
  const [postContent, setPostContent] = useState<string>(params.content);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(params.recipientId);
  const [replyToPostId, setReplyToPostId] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
    params.allColors.find((c) => c.id === params.color) ?? 
    defaultColors[Math.floor(Math.random() * defaultColors.length)]
  );
  const [formats, setFormats] = useState<Format[]>([]);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [selectedStaticEmoji, setSelectedStaticEmoji] = useState<boolean>(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(params.emoji || null);
  const [isEmojiSelectorVisible, setIsEmojiSelectorVisible] = useState(false);
  const [isQuickEmojiSelectorVisible, setQuickEmojiSelectorVisible] = useState(false);
  const [showRecentPopup, setShowRecentPopup] = useState(false);
  const [triggerPosition, setTriggerPosition] = useState({ x: 200, y: 400 });
  const [activeEmojiIndex, setActiveEmojiIndex] = useState(-1);
  const [selectedTab, setSelectedTab] = useState<string>("create");
  const [isLinkHolderVisible, setIsLinkHolderVisible] = useState(false);
  const [link, setLink] = useState<string>("");
  const [isSettingVisible, setIsSettingVisible] = useState(false);
  const [withdrawKeyboard, setWithdrawKeyboard] = useState(false);
  const [selectedExpirationDate, setSelectedExpirationDate] = useState<string>(params.expiration);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>("");
  const [refreshingKey, setRefreshingKey] = useState<number>(0);
  
  const emojiButtonRef = useRef<any>(null);
  const maxCharacters = 3000;

  // Handlers
  const toggleEmojiSelector = () => {
    setIsEmojiSelectorVisible((prev) => !prev);
  };

  const handleColorSelect = (color: PostItColor) => {
    setSelectedColor(color);
    setIsEmojiSelectorVisible(false);
  };

  const handleChangeText = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length <= maxCharacters) {
      setPostContent(trimmed);
    } else {
      setPostContent(trimmed.substring(0, maxCharacters));
      showAlert({
        title: "Limit Reached",
        message: `You can only enter up to ${maxCharacters} characters.`,
        type: "ERROR",
        status: "error",
      });
    }
  };

  const handleChangeFormat = (formats: Format[]) => {
    setFormats(formats);
  };

  const handleEmojiSelect = async (emoji: string) => {
    await addRecentEmoji(emoji);
    if (emoji === selectedEmoji) {
      setSelectedEmoji(null);
    } else {
      setSelectedEmoji(emoji);
    }
  };

  const handleChangeFocus = (state: boolean) => {
    setIsFocused(state);
  };

  const resetDraftPost = () => {
    setPostContent("");
    setFormats([]);
    setSelectedRecipientId("");
    setSelectedUser(undefined);
    setSelectedEmoji("");
    setSelectedScheduleDate("");
    setSelectedExpirationDate("");
    setReplyToPostId(null);
    setSelectedStaticEmoji(false);

    setDraftPost({
      id: 0,
      user_id: user?.id ?? "",
      firstname: "",
      username: userUsername ?? "",
      nickname: "",
      incognito_name: "",
      content: "",
      created_at: new Date().toISOString(),
      expires_at: "",
      available_at: "",
      static_emoji: false,
      city: "",
      state: "",
      country: "",
      like_count: 0,
      report_count: 0,
      unread_comments: 0,
      recipient_user_id: "",
      pinned: false,
      color: "",
      emoji: "",
      notified: false,
      prompt_id: 0,
      prompt: "",
      board_id: -1,
      reply_to: replyToPostId ?? 0,
      unread: false,
      formatting: [],
    });
  };

  const selectedUserInfo = (info: UserNicknamePair) => {
    setSelectedUser(info);
    setSelectedRecipientId(info[0]);
    setUserUsername(info[1]);
  };

  const handleSubmit = async () => {
    if (!draftPost) return;
    try {
      const status = await handleSubmitPost(user!.id, draftPost as Post, encryptionKey);
      console.log("[DEBUG] Post submission status:", status);
      
      if (status === "success") {
        showAlert({
          title: "Success",
          message: "Post created successfully.",
          type: "SUCCESS",
          status: "success",
        });
        resetDraftPost();
        router.back();
      } else if (status === "error") {
        showAlert({
          title: "Error",
          message: "Failed to create post.",
          type: "ERROR",
          status: "error",
        });
      }
    } catch (error) {
      console.error("[DEBUG] Error in post submission:", error);
      showAlert({
        title: "Error",
        message: "An unexpected error occurred.",
        type: "ERROR",
        status: "error",
      });
    }
  };

  const handleNavigation = (action: 'back' | 'submit' | 'finalize') => {
    playSoundEffect(SoundType.Navigation);
    Haptics.selectionAsync();
    
    switch (action) {
      case 'back':
        if (selectedTab === "customize") {
          setSelectedTab("create");
        } else {
          router.back();
        }
        break;
      case 'submit':
        if (selectedTab === "customize") {
          handleSubmit();
        } else {
          resetDraftPost();
          setRefreshingKey((prev) => prev + 1);
        }
        break;
      case 'finalize':
        if (selectedTab === "customize") {
          setIsSettingVisible(true);
        } else {
          if (postContent.trim() === "") {
            showAlert({
              title: "Warning",
              message: "Post content cannot be empty.",
              type: "WARNING",
              status: "error",
            });
            return;
          }
          setSelectedTab("customize");
          setRefreshingKey((prev) => prev + 1);
        }
        break;
    }
  };

  // Effects
  useEffect(() => {
    if (selectedEmoji && isEmojiSelectorVisible) {
      toggleEmojiSelector();
    }
  }, [selectedEmoji]);

  useEffect(() => {
    setDraftPost({
      id: Number(initialParams.postId ?? 0),
      user_id: user?.id ?? "",
      firstname: "",
      username: userUsername ?? "",
      nickname: "",
      incognito_name: "",
      content: postContent,
      created_at: new Date().toISOString(),
      expires_at: selectedExpirationDate || "",
      available_at: selectedScheduleDate || "",
      static_emoji: selectedStaticEmoji,
      city: "",
      state: "",
      country: "",
      like_count: 0,
      report_count: 0,
      unread_comments: 0,
      recipient_user_id: selectedRecipientId ?? "",
      pinned: false,
      color: selectedColor.id,
      emoji: selectedEmoji ?? "",
      notified: false,
      prompt_id: params.promptId ? Number(params.promptId) : 0,
      prompt: typeof params.prompt === "string" ? params.prompt : "",
      board_id: params.boardId ? Number(params.boardId) : -1,
      reply_to: replyToPostId ?? 0,
      unread: false,
      formatting: formats,
    });
  }, [
    initialParams.postId,
    user,
    selectedExpirationDate,
    selectedScheduleDate,
    selectedRecipientId,
    selectedStaticEmoji,
    postContent,
    selectedColor,
    selectedEmoji,
    params.recipientId,
    params.promptId,
    params.prompt,
    params.boardId,
    formats,
    replyToPostId,
    encryptionKey,
  ]);

  useEffect(() => {
    if (draftPost && !initialParams.postId) {
      setPostContent(draftPost.content);
      const savedColor = userColors.find((c) => c.id === draftPost.color);
      if (savedColor) setSelectedColor(savedColor);
      if (draftPost.emoji) setSelectedEmoji(draftPost.emoji);
      if (draftPost.recipient_user_id) setSelectedRecipientId(draftPost.recipient_user_id);
      if (draftPost.username && typeof draftPost.username === "string") setUserUsername(draftPost.username);
      if (draftPost.formatting) setFormats(formats);
      if (draftPost.available_at) setSelectedScheduleDate(draftPost.available_at);
      if (draftPost.expires_at) setSelectedExpirationDate(draftPost.expires_at);
      if (draftPost.reply_to) setReplyToPostId(draftPost.reply_to);
      if (draftPost.static_emoji) setSelectedStaticEmoji(draftPost.static_emoji);
      if (draftPost.reply_to > 0) setReplyToPostId(draftPost.reply_to);
    }
  }, []);

  useEffect(() => {
    if (params.recipientId && params.username) {
      const id = Array.isArray(params.recipientId) ? params.recipientId[0] : params.recipientId;
      const uname = Array.isArray(params.username) ? params.username[0] : params.username;
      setSelectedUser([id, uname]);
    }
  }, [params.recipientId, params.username]);

  return {
    // State
    selectedUser,
    userUsername,
    postContent,
    selectedRecipientId,
    replyToPostId,
    selectedColor,
    formats,
    isFocused,
    selectedStaticEmoji,
    selectedEmoji,
    isEmojiSelectorVisible,
    isQuickEmojiSelectorVisible,
    showRecentPopup,
    triggerPosition,
    activeEmojiIndex,
    selectedTab,
    isLinkHolderVisible,
    link,
    isSettingVisible,
    withdrawKeyboard,
    selectedExpirationDate,
    selectedScheduleDate,
    refreshingKey,
    emojiButtonRef,
    draftPost,
    userColors,
    shorthandEmojis,
    recentEmojis,
    profile,
    
    // Setters
    setSelectedUser,
    setUserUsername,
    setSelectedRecipientId,
    setReplyToPostId,
    setSelectedColor,
    setFormats,
    setIsFocused,
    setSelectedStaticEmoji,
    setSelectedEmoji,
    setIsEmojiSelectorVisible,
    setQuickEmojiSelectorVisible,
    setShowRecentPopup,
    setTriggerPosition,
    setActiveEmojiIndex,
    setSelectedTab,
    setIsLinkHolderVisible,
    setLink,
    setIsSettingVisible,
    setWithdrawKeyboard,
    setSelectedExpirationDate,
    setSelectedScheduleDate,
    setRefreshingKey,
    
    // Handlers
    toggleEmojiSelector,
    handleColorSelect,
    handleChangeText,
    handleChangeFormat,
    handleEmojiSelect,
    handleChangeFocus,
    resetDraftPost,
    selectedUserInfo,
    handleSubmit,
    handleNavigation,
    addRecentEmoji,
  };
};

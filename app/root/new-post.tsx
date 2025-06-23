import { SignedIn, useUser } from "@clerk/clerk-expo";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  PanResponder,
} from "react-native";
import EmojiSelector from "@/components/EmojiSelector";
import RecentEmojiPopup from "@/components/RecentEmojiPopup";
import { useRecentEmojis } from "@/hooks/useRecentEmojis";

import ColorSelector from "@/components/ColorSelector";
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import {
  PostItColor,
  UserNicknamePair,
  TextStyle,
  Format,
  Post,
  Board,
} from "@/types/type";
import { useAlert } from "@/notifications/AlertContext";
import ModalSheet from "@/components/Modal";
import { fetchFriendStatus } from "@/lib/friend";
import { fetchFriends } from "@/lib/friend";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import ItemContainer from "@/components/ItemContainer";
import { useGlobalContext } from "../globalcontext";

import { CustomButtonBar } from "@/components/CustomTabBar";
import Header from "@/components/Header";
import ColorPickerSlider from "@/components/ColorPickerSlider";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import RichTextEditor from "@/components/RichTextEditor";
import RichTextInput from "@/components/RichTextInput";
import KeyboardOverlay from "@/components/KeyboardOverlay";
import PostContainer from "@/components/PostContainer";
import { handleSubmitPost } from "@/lib/post";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { SoundType, useSoundEffects } from "@/hooks/useSoundEffects";
import { useHaptics } from "@/hooks/useHaptics";
import InteractionButton from "@/components/InteractionButton";
import EmojiShorthand from "@/components/EmojiShorthand";
import PostGallery from "@/components/PostGallery";
import CalendarView from "@/components/CalendarView";
import { format, isAfter } from "date-fns";
import { stripMarkdown } from "@/components/RichTextInput";
import { FindUser } from "@/components/FindUsers";
import CustomButton from "@/components/CustomButton";
import { allColors, defaultColors } from "@/constants/colors";

const NewPost = () => {
  const { playSoundEffect } = useSoundEffects();

  // ✅ Imports & Hooks
  const { user } = useUser();
  const rawParams = useLocalSearchParams();
  const safeParam = (p: string | string[] | undefined): string =>
    Array.isArray(p) ? p[0] : (p ?? "");

  const postId = safeParam(rawParams.postId as any);
  const content = safeParam(rawParams.content as any);
  const color = safeParam(rawParams.color as any);
  const emoji = safeParam(rawParams.emoji as any);
  const recipientId = safeParam(rawParams.recipientId as any);
  const username = safeParam(rawParams.username as any);
  const expiration = safeParam(rawParams.expiration as any);
  const prompt = safeParam(rawParams.prompt as any);
  const promptId = safeParam(rawParams.promptId as any);
  const boardId = safeParam(rawParams.boardId as any);
  const { profile, userColors, setDraftPost, draftPost, encryptionKey } =
    useGlobalContext();
  const { showAlert } = useAlert();

  // 🔒 USER & GLOBAL STATE
  const [selectedUser, setSelectedUser] = useState<UserNicknamePair>();
  const [userUsername, setUserUsername] = useState<string>(username);

  // 📥 POST CONTENT & METADATA
  const [postContent, setPostContent] = useState<string>(content);
  const [selectedRecipientId, setSelectedRecipientId] =
    useState<string>(recipientId);
  const [replyToPostId, setReplyToPostId] = useState<number | null>(null);
  const maxCharacters = 3000;

  // 🎨 STYLING & FORMATTING
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
    allColors.find((c) => c.id === color) ??
      defaultColors[Math.floor(Math.random() * defaultColors.length)]
  );
  const [formats, setFormats] = useState<Format[]>([]);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // 😊 EMOJI HANDLING
  const [selectedStaticEmoji, setSelectedStaticEmoji] =
    useState<boolean>(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(
    emoji || null
  );
  const [isEmojiSelectorVisible, setIsEmojiSelectorVisible] = useState(false);
  const [isQuickEmojiSelectorVisible, setQuickEmojiSelectorVisible] =
    useState(false);
  const [showRecentPopup, setShowRecentPopup] = useState(false);
  const [triggerPosition, setTriggerPosition] = useState({ x: 200, y: 400 }); // Default position
  const [activeEmojiIndex, setActiveEmojiIndex] = useState(-1);

  // ⚙️ UI STATE & INTERACTIONS
  const [selectedTab, setSelectedTab] = useState<string>("create");
  const [isLinkHolderVisible, setIsLinkHolderVisible] = useState(false);
  const [link, setLink] = useState<string>("");
  const [isSettingVisible, setIsSettingVisible] = useState(false);

  // 📆 SCHEDULING & EXPIRATION
  const [selectedExpirationDate, setSelectedExpirationDate] =
    useState<string>(expiration);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>("");

  // 🔁 REFRESH & DATA FETCHING
  const [refreshingKey, setRefreshingKey] = useState<number>(0);

  const emojiButtonRef = useRef<any>(null);
  const { recentEmojis, addRecentEmoji } = useRecentEmojis();

  const toggleEmojiSelector = () => {
    setIsEmojiSelectorVisible((prev) => !prev);
  };

  const handleEmojiLongPress = () => {
    // Don't open popup if there are no recent emojis
    if (recentEmojis.length === 0) {
      return;
    }

    // Close emoji selector if it's open
    if (isEmojiSelectorVisible) {
      setIsEmojiSelectorVisible(false);
    }

    // Measure button position for popup placement
    if (emojiButtonRef.current) {
      emojiButtonRef.current.measure(
        (
          x: number,
          y: number,
          width: number,
          height: number,
          pageX: number,
          pageY: number
        ) => {
          setTriggerPosition({
            x: pageX + width / 2,
            y: pageY + height + 5, // Add a small offset for better appearance
          });

          // Show popup - haptic feedback is now handled in the popup component
          setShowRecentPopup(true);
        }
      );
    }
  };

  const handleRecentEmojiSelect = async (emoji: string) => {
    // Add to recent emojis (moves to front)
    await addRecentEmoji(emoji);

    // Set as selected emoji
    setSelectedEmoji(emoji);

    // The popup handles its own animation now,
    // but we still need to update the state after animation completes
    setTimeout(() => {
      setShowRecentPopup(false);
    }, 350); // Wait for animation to complete
  };

  const [selectExpirationDate, setSelectExpirationDate] = useState<string>(
    expiration as string
  );

  const expirationDate = ["1 day", "3 days", "7 days", "14 days"];

  console.log(
    "arguments passed: ",
    "|postId",
    postId,
    "|content",
    content,
    "|color",
    color,
    "|emoji",
    emoji,
    "|recipient",
    recipientId,
    "|username",
    username,
    "|exp",
    expiration,
    "|prompt",
    prompt,
    "|promptId",
    promptId,
    "|board",
    boardId
  );

  const tabs = [
    { name: "Create", key: "create", color: "#000" },
    { name: "Customize", key: "customize", color: "#000" },
  ];

  const handleColorSelect = (color: PostItColor) => {
    setSelectedColor(color);
    setIsEmojiSelectorVisible(false);
  };

  const handleChangeText = (text: string) => {
    if (text.length <= maxCharacters) {
      setPostContent(text);
    } else {
      setPostContent(text.substring(0, maxCharacters));
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

  const isLink = (text: string) => {
    try {
      // Attempt to create a URL object (browser & Node.js compatible)
      new URL(text.trim());
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleEmojiSelect = async (emoji: string) => {
    // Add to recent emojis
    await addRecentEmoji(emoji);

    // Handle selection logic
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
    setSelectedRecipientId(info[0]);
    setUserUsername(info[1]);
  };

  useEffect(() => {
    if (selectedEmoji && isEmojiSelectorVisible) {
      toggleEmojiSelector();
    }
  }, [selectedEmoji]);

  useEffect(() => {
    //console.log("Post content updated:", postContent);
    if (postId) {
      setPostContent(content as string);
    }
    setDraftPost({
      id: Number(postId ?? 0),
      user_id: user?.id ?? "",
      firstname: "",
      username: userUsername ?? "",
      nickname: "",
      incognito_name: "",
      content: postContent ? stripMarkdown(postContent) : "",
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
      prompt_id: promptId ? Number(promptId) : 0,
      prompt: typeof prompt === "string" ? prompt : "",
      board_id: boardId ? Number(boardId) : -1,
      reply_to: replyToPostId ?? 0,
      unread: false,
      formatting: formats,
    });
  }, [
    postId,
    user,
    selectedExpirationDate,
    selectedScheduleDate,
    selectedRecipientId,
    selectedStaticEmoji,
    postContent,
    selectedColor,
    selectedEmoji,
    recipientId,
    promptId,
    prompt,
    boardId,
    formats,
    replyToPostId,
  ]);

  useEffect(() => {
    if (draftPost && !postId) {
      setPostContent(draftPost.content);
      const savedColor = userColors.find((c) => c.id === draftPost.color);
      if (savedColor) setSelectedColor(savedColor);
      if (draftPost.emoji) setSelectedEmoji(draftPost.emoji);
      if (draftPost.recipient_user_id)
        setSelectedRecipientId(draftPost.recipient_user_id);
      if (draftPost.username && typeof draftPost.username === "string")
        setUserUsername(draftPost.username);
      if (draftPost.formatting) setFormats(formats);
      if (draftPost.available_at)
        setSelectedScheduleDate(draftPost.available_at);
      if (draftPost.expires_at) setSelectedExpirationDate(draftPost.expires_at);
      if (draftPost.reply_to) setReplyToPostId(draftPost.reply_to);
      if (draftPost.static_emoji)
        setSelectedStaticEmoji(draftPost.static_emoji);
      if (draftPost.reply_to > 0) setReplyToPostId(draftPost.reply_to);
    }
  }, []);

  useEffect(() => {
    if (recipientId && username) {
      const id = Array.isArray(recipientId) ? recipientId[0] : recipientId;
      const uname = Array.isArray(username) ? username[0] : username;
      setSelectedUser([id, uname]);
    }
  }, [recipientId, username]);

  useEffect(() => {
    if (!selectedScheduleDate || !selectedExpirationDate) {
      return;
    }

    if (
      isAfter(new Date(selectedScheduleDate), new Date(selectedExpirationDate))
    ) {
      showAlert({
        title: "Error",
        message: `Schedule date must be before expiration date`,
        type: "ERROR",
        status: "error",
      });
      setSelectedExpirationDate("");
    } else {
      showAlert({
        title: "Success",
        message: `Scheduled for ${format(new Date(selectedScheduleDate), "MMMM do")} and expires on ${format(new Date(selectedExpirationDate), "MMMM do")}`,
        type: "SUCCESS",
        status: "success",
      });
    }
  }, [selectedScheduleDate, selectedExpirationDate]);

  const navigationControls = [
    {
      icon: icons.back,
      label: "Back",
      onPress: () => {
        playSoundEffect(SoundType.Navigation);
        Haptics.selectionAsync();
        if (selectedTab == "customize") {
          setSelectedTab("create");
        } else {
          router.back();
        }
      },
    },
    {
      icon: selectedTab == "customize" ? icons.send : icons.eraser,
      label: "New Post",
      onPress: async () => {
        playSoundEffect(SoundType.Navigation);
        Haptics.selectionAsync();
        if (selectedTab == "customize") {
          if (!draftPost) return;
          const status = await handleSubmitPost(
            user!.id,
            draftPost as Post,
            encryptionKey
          );
          console.log("status: ", status);
          if (status == "success") {
            showAlert({
              title: "Success",
              message: "Post created successfully.",
              type: "SUCCESS",
              status: "success",
            });
            resetDraftPost();
            router.back();
          } else {
            showAlert({
              title: "Error",
              message: "Failed to create post.",
              type: "ERROR",
              status: "error",
            });
          }
        } else {
          resetDraftPost();
          setRefreshingKey((prev) => prev + 1);
        }
      },
      isCenter: true,
    },
    {
      icon: selectedTab == "customize" ? icons.settings : icons.pencil,
      label: selectedTab == "customize" ? "More" : "Finalize",
      onPress: () => {
        playSoundEffect(SoundType.Navigation);
        Haptics.selectionAsync();
        if (selectedTab == "customize") {
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
      },
      isCenter: true,
    },
  ];

  const handleTabChange = (tabKey: string) => {
    console.log("Tab changed to:", tabKey);
    setSelectedTab(tabKey);
  };

  const [selectedSetting, setSelectedSetting] = useState<string>("");
  const [userPosts, setUserPosts] = useState<Post[]>([]);

  const fetchUserPosts = async (userId: string) => {
    try {
      const response = await fetchAPI(`/api/posts/getUserPosts?id=${userId}`);
      if (response.error) {
        throw new Error(response.error);
      }
      const { userInfo, posts } = response;
      console.log("response: ", response);
      return posts;
    } catch (err) {
      console.error("Failed to fetch user posts:", err);
      return [];
    }
  };

  const PostSettings = () => {
    const allOptions = [
      {
        label: "Recipient",
        component: (
          <ItemContainer
            label={
              selectedUser
                ? selectedUser[1] === profile?.username
                  ? "Youself"
                  : selectedUser[1]
                : "Select recipient"
            }
            caption={
              selectedUser
                ? `Sending this to ${selectedUser[1]}`
                : "Add recipient to this post"
            }
            icon={icons.addUser}
            colors={[selectedColor.foldcolorhex, selectedColor.hex]}
            iconColor="#000"
            onPress={() => setSelectedSetting("Recipient")}
            actionIcon={selectedRecipientId && icons.check}
          />
        ),
      },
      {
        /*
        label: "Board",
        component: <ItemContainer
        label="Select a board"
        caption="Add this post to a board"
        icon={icons.addUser}
        colors={[selectedColor.foldcolorhex, selectedColor.hex]}
        iconColor="#000"
        onPress={() => setSelectedSetting}
      />*/
      },
      {
        label: "Schedule",
        component: (
          <ItemContainer
            label={
              selectedScheduleDate
                ? `Set for ${format(new Date(selectedScheduleDate), "MMMM do")}`
                : "Schedule"
            }
            caption={
              selectedScheduleDate
                ? "Modify scheduled date"
                : "Schedule this post for later."
            }
            icon={icons.chevron}
            colors={[selectedColor.foldcolorhex, selectedColor.hex]}
            iconColor="#000"
            actionIcon={selectedScheduleDate && icons.check}
            onPress={() => setSelectedSetting("Schedule")}
          />
        ),
      },
      {
        label: "Expiration",
        component: (
          <ItemContainer
            label={
              selectedExpirationDate
                ? `Expires on ${format(new Date(selectedExpirationDate), "MMMM do")}`
                : "Expiration"
            }
            caption={
              selectedExpirationDate
                ? "Modify the expiration date"
                : "Set an expiration date for this post"
            }
            icon={icons.timer}
            colors={[selectedColor.foldcolorhex, selectedColor.hex]}
            iconColor="#000"
            actionIcon={selectedExpirationDate && icons.check}
            onPress={() => setSelectedSetting("Expiration")}
          />
        ),
      },
      {
        /*
        label: "Reply",
        component: (
          <ItemContainer
            label={replyToPostId ? "Reply selected!" : "Reply to another post"}
            caption="Send this as a reply to another post"
            icon={icons.link}
            colors={[selectedColor.foldcolorhex, selectedColor.hex]}
            iconColor="#000"
            onPress={() => {
              fetchUserPosts(user!.id).then((posts) => {
                setUserPosts(posts);
                setSelectedSetting("Reply");
              });
            }}
            actionIcon={replyToPostId && icons.check}
          />
        ),
      */
      },
    ];

    const menuOptions = promptId
      ? allOptions.filter((option) => option.label !== "Recipient")
      : !recipientId && !boardId && !expiration
        ? allOptions.filter(
            (option) =>
              option.label !== "Recipient" &&
              option.label !== "Mentions" &&
              option.label !== "Board"
          )
        : recipientId
          ? allOptions.filter((option) => option.label !== "Board")
          : allOptions.filter((option) => option.label !== "Recipient");

    return (
      <ModalSheet
        title="Settings"
        isVisible={true}
        onClose={() => {
          setIsSettingVisible(false);
          setSelectedSetting("");
        }}
      >
        <View className="flex-1 h-full px-6">
          {!selectedSetting ? (
            <FlatList
              data={menuOptions}
              keyExtractor={(item, index) => item.label ?? `option-${index}`}
              renderItem={({ item }) => item.component ?? null}
              contentContainerStyle={{ padding: 16 }}
              showsVerticalScrollIndicator={false}
            />
          ) : selectedSetting == "Reply" ? (
            <View className="flex-1">
              <View className="flex-1">
                <PostGallery
                  posts={userPosts}
                  profileUserId={""}
                  disableModal
                  handleUpdate={(id: number) => {
                    setReplyToPostId(id);
                    setSelectedSetting("");
                  }}
                />
              </View>
              {replyToPostId && (
                <TouchableOpacity
                  onPress={() => {
                    setReplyToPostId(null);
                    setSelectedSetting("");
                  }}
                  className="w-full mt-4 flex-row items-center justify-center"
                >
                  <Text className="text-[14px] font-Jakarta font-regular text-gray-400">
                    Remove reply
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : selectedSetting == "Recipient" ? (
            <View className="flex-1">
              <FindUser
                selectedUserInfo={(item: UserNicknamePair) => {
                  selectedUserInfo(item);
                  setSelectedRecipientId(item[0]);
                  setSelectedSetting("");
                }}
              />
            </View>
          ) : ["Schedule", "Expiration"].includes(selectedSetting) ? (
            <View className="flex-1">
              <CalendarView
                color={selectedColor?.hex}
                onDateSelect={
                  selectedSetting === "Schedule"
                    ? (selected: Date) => {
                        setSelectedScheduleDate(selected.toISOString());
                        setSelectedSetting("");
                      }
                    : (selected: Date) => {
                        setSelectedExpirationDate(selected.toISOString());
                        setSelectedSetting("");
                      }
                }
                selectedDate={
                  selectedSetting === "Schedule"
                    ? selectedScheduleDate
                      ? new Date(selectedScheduleDate)
                      : null
                    : selectedExpirationDate
                      ? new Date(selectedExpirationDate)
                      : null
                }
                startDate={
                  selectedSetting === "Expiration" && selectedScheduleDate
                    ? new Date(selectedScheduleDate)
                    : new Date()
                }
              />
            </View>
          ) : (
            <View></View>
          )}
        </View>

        {selectedSetting == "Recipient" && (
          <View className="flex items-center w-full mb-4">
            <CustomButton
              fontSize="lg"
              title="Keep it Private"
              padding={4}
              bgVariant="gradient5"
              onPress={() => {
                setSelectedRecipientId(user!.id);

                setUserUsername("Yourself");
                setSelectedUser([user!.id, profile.username]);
                setSelectedSetting("");
              }}
            />
          </View>
        )}
        {selectedSetting && (
          <View className="flex items-center w-full mb-4">
            <CustomButton
              fontSize="lg"
              title="Close"
              padding={4}
              onPress={() => {
                setSelectedSetting("");
              }}
            />
          </View>
        )}
      </ModalSheet>
    );
  };

  const LinkPlaceholder = () => {
    const inputRef = useRef<TextInput>(null);

    // Trigger keyboard immediately when component mounts
    useEffect(() => {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150); // Small delay ensures proper mounting

      return () => clearTimeout(timer);
    }, []);

    return (
      <TextInput
        ref={inputRef}
        className="w-[90%] h-12 rounded-[16px] bg-gray-100 p-4 text-[16px] font-Jakarta"
        placeholder="Paste your link here"
        value={link}
        onChangeText={setLink}
        onSubmitEditing={() => {
          if (isLink(link)) {
            setIsLinkHolderVisible(false);
            //(prev => `${prev}\n${link}`);
            setLink("");
          } else {
            showAlert({
              title: "Invalid Link",
              message: "Please enter a valid URL.",
              type: "ERROR",
              status: "error",
            });
          }
        }}
        autoFocus={false}
        keyboardType="url"
        returnKeyType="done"
      />
    );
  };

  const backgroundColor = useSharedValue(
    selectedColor?.hex || "rgba(0, 0, 0, 0.5)"
  );
  const prevColor = React.useRef(backgroundColor.value);

  useEffect(() => {
    if (prevColor.current !== (selectedColor?.hex || "rgba(0, 0, 0, 0.5)")) {
      backgroundColor.value = withTiming(
        selectedColor?.hex || "rgba(0, 0, 0, 0.5)",
        {
          duration: 300,
          easing: Easing.inOut(Easing.quad),
        }
      );
      prevColor.current = selectedColor?.hex || "rgba(0, 0, 0, 0.5)";
    }
  }, [selectedColor]);

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
  }));

  useEffect(() => {
    setIsEmojiSelectorVisible(false);
    setQuickEmojiSelectorVisible(false);
  }, [selectedEmoji]);

  return (
    <Animated.View className="flex-1" style={[animatedBackgroundStyle]}>
      <TouchableWithoutFeedback
        accessible={false}
        onPress={() => {
          if (!isFocused) {
            Keyboard.dismiss();
          }
        }}
      >
        <View className="flex-1">
          <Header
            title={
              postId
                ? "Edit Post"
                : prompt
                  ? `${Array.isArray(prompt) ? prompt[0] : prompt}`.trim()
                  : recipientId
                    ? `@${userUsername}`
                    : "New Post"
            }
          />
          {selectedTab == "create" && (
            <TouchableWithoutFeedback
              accessible={false}
              onPress={() => {
                if (!isFocused) {
                  Keyboard.dismiss();
                }
              }}
            >
              <View
                className="flex-1  mt-0 overflow-hidden "
                style={[animatedBackgroundStyle]}
              >
                <View className="flex-1 ">
                  <KeyboardAvoidingView
                    behavior="padding"
                    className="flex-1 flex w-full"
                  >
                    <View className="flex-1 flex-column justify-start items-center  ">
                      <View className="w-full">
                        <RichTextInput
                          refresh={refreshingKey}
                          exportStyling={handleChangeFormat}
                          exportText={handleChangeText}
                          onFocus={handleChangeFocus}
                        />
                      </View>
                    </View>
                  </KeyboardAvoidingView>
                </View>

                <View className="flex-1 flex-col items-center justify-center gap-2 absolute p-4 mt-4 right-0">
                  <View>
                    <ColorPickerSlider
                      colors={userColors}
                      selectedColor={selectedColor}
                      onColorSelect={handleColorSelect}
                    />
                  </View>
                  <View>
                    <View className="flex flex-col items-center justify-center gap-2 py-2 rounded-[32px]">
                      <View>
                        <InteractionButton
                          label=""
                          icon={icons.wink}
                          emoji={selectedEmoji ? selectedEmoji : ""}
                          showLabel={false}
                          color={"#000000"}
                          onPress={() =>
                            setQuickEmojiSelectorVisible((prev) => !prev)
                          }
                          //onPress={toggleEmojiSelector}
                          size={"sm"}
                          styling="shadow-md"
                        />
                      </View>
                      {isQuickEmojiSelectorVisible && (
                        <View>
                          <EmojiShorthand
                            onEmojiSelected={(emoji: string) =>
                              handleEmojiSelect(emoji)
                            }
                          />
                        </View>
                      )}
                      {isQuickEmojiSelectorVisible && (
                        <View>
                          <InteractionButton
                            label=""
                            icon={icons.add}
                            emoji={""}
                            showLabel={false}
                            color={"#C1C1C1"}
                            onPress={toggleEmojiSelector}
                            size={"sm"}
                            styling="shadow-md"
                          />
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          )}
          {selectedTab == "customize" && (
            <View key={refreshingKey} className="absolute top-8">
              <PostContainer
                selectedPosts={draftPost ? [draftPost] : []}
                handleCloseModal={() => {}}
                isPreview={true}
                header={
                  <View className="absolute z-[10] top-28 right-5 flex flex-col items-center justify-end">
                    {/* <TouchableOpacity
                    onPress={() => {setIsLinkHolderVisible(true)}}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                  >
                    <Image
                      source={icons.link}
                      className="w-6 h-6"
                      tintColor={'#fff'}
                    />
                  </TouchableOpacity>*/}
                    <InteractionButton
                      label={""}
                      icon={
                        !selectedStaticEmoji
                          ? icons.sparklesFill
                          : icons.sparkles
                      }
                      size="sm"
                      onPress={() => {
                        if (selectedEmoji) {
                          setSelectedStaticEmoji((prev) => !prev);
                          setRefreshingKey((prev) => prev + 1);
                        }
                      }}
                      showLabel={false}
                      color={""}
                    />
                  </View>
                }
                staticEmoji={selectedStaticEmoji}
              />
            </View>
          )}

          {isSettingVisible && PostSettings()}

          {isEmojiSelectorVisible && (
            <EmojiSelector
              showInModal={true}
              isVisible={true}
              onClose={() => setIsEmojiSelectorVisible(false)}
              onEmojiSelected={handleEmojiSelect}
              selectedEmoji={selectedEmoji}
              mode="both"
            />
          )}

          <CustomButtonBar buttons={navigationControls} />

          {/* Recent Emoji Popup */}
          <RecentEmojiPopup
            visible={showRecentPopup}
            recentEmojis={recentEmojis}
            onEmojiSelect={handleRecentEmojiSelect}
            onClose={() => setShowRecentPopup(false)}
            triggerPosition={triggerPosition}
            activeIndex={activeEmojiIndex}
          />
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

export default NewPost;

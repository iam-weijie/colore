import { SignedIn, useUser } from "@clerk/clerk-expo";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState, useRef } from "react";
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
import { icons, temporaryColors } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { PostItColor, UserNicknamePair, TextStyle, Format } from "@/types/type";
import { useAlert } from "@/notifications/AlertContext";
import ModalSheet from "@/components/Modal";
import { fetchFriends } from "@/lib/friend";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import ItemContainer from "@/components/ItemContainer";
import { useGlobalContext } from "../globalcontext";

import { CustomButtonBar } from "@/components/CustomTabBar";
import Header from "@/components/Header";
import ColorPickerSlider from "@/components/ColorPickerSlider";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
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

const NewPost = () => {
  const { playSoundEffect } = useSoundEffects();

  const { user } = useUser();
  const {
    postId,
    content,
    color,
    emoji,
    recipientId,
    username,
    expiration,
    prompt,
    promptId,
    boardId,
  } = useLocalSearchParams();

  const { setDraftPost, draftPost } = useGlobalContext();
  const { showAlert } = useAlert();

  const [selectedTab, setSelectedTab] = useState<string>("create");

  const [selectedUser, setSelectedUser] = useState<UserNicknamePair>();
  const [selectedRecipientId, setSelectedRecipientId] =
    useState<string>(recipientId as string);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userUsername, setUserUsername] = useState<string>(username as string);
  const [postContent, setPostContent] = useState<string>(content as string);
  const [inputHeight, setInputHeight] = useState(40);
  const maxCharacters = 3000;
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
    temporaryColors.find((c) => c.name === color) ??
      temporaryColors[Math.floor(Math.random() * 4)]
  );
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(emoji as string);
  const [isEmojiSelectorVisible, setIsEmojiSelectorVisible] = useState(false);
  const [isQuickEmojiSelectorVisible, setQuickEmojiSelectorVisible] = useState(false)
  const [showRecentPopup, setShowRecentPopup] = useState(false);
  const [triggerPosition, setTriggerPosition] = useState({ x: 200, y: 400 }); // Default position
  const [activeEmojiIndex, setActiveEmojiIndex] = useState(-1);
  const [textStyling, setTextStyling] = useState<TextStyle | null>(null);
  const [refreshingKey, setRefreshingKey] = useState<number>(0);
  const [formats, setFormats] = useState<Format[]>([]);

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
      emojiButtonRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setTriggerPosition({
          x: pageX + width / 2,
          y: pageY + height + 5 // Add a small offset for better appearance
        });
        
        // Show popup - haptic feedback is now handled in the popup component
        setShowRecentPopup(true);
      });
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

  const [selectExpirationDate, setSelectExpirationDate] =
    useState<string>(expiration as string);

  const expirationDate = ["1 day", "3 days", "7 days", "14 days"];

  //console.log("arguments passed: ", postId, content, color, emoji, recipientId, username, expiration, prompt, promptId, boardId  )

  const tabs = [
    { name: "Create", key: "create", color: "#000" },
    { name: "Customize", key: "customize", color: "#000" },
    { name: "Information", key: "information", color: "#000" },
  ];

  const handleColorSelect = (color: PostItColor) => {
    setSelectedColor(color);
    setIsEmojiSelectorVisible(false);
  };

  const applyStyle = (newStyle: TextStyle) => {
    setTextStyling(newStyle);
    setRefreshingKey((prev) => prev + 1);
    Keyboard.dismiss();
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

  const selectedUserInfo = (info: UserNicknamePair) => {
    setSelectedUser(info);
    setSelectedRecipientId(info[0]);
    setUserUsername(info[1]);
    setIsModalVisible(false);
  };

  useEffect(() => {
    if (selectedEmoji && isEmojiSelectorVisible) {
      toggleEmojiSelector();
    }
  }, [selectedEmoji]);

  useEffect(() => {
    if (postId) {
      setPostContent(content as string);
    }
    setDraftPost({
      id: Number(postId ?? 0),
      clerk_id: user?.id ?? "",
      firstname: "",
      username: userUsername ?? "",
      content: postContent,
      created_at: new Date().toISOString(),
      expires_at: "", // Let the backend calculate it or parse from selectExpirationDate if needed
      city: "",
      state: "",
      country: "",
      like_count: 0,
      report_count: 0,
      unread_comments: 0,
      recipient_user_id: selectedRecipientId ?? "",
      pinned: false,
      color: selectedColor.name,
      emoji: selectedEmoji ?? "",
      notified: false,
      prompt_id: promptId ? Number(promptId) : 0,
      prompt: typeof prompt === 'string' ? prompt : "",
      board_id: boardId ? Number(boardId) : -1,
      reply_to: 0,
      unread: false,
      formatting: formats,
    });
  }, [
    postId,
    user,
    postContent,
    selectedColor,
    selectedEmoji,
    recipientId,
    promptId,
    prompt,
    boardId,
    formats,
  ]);

  useEffect(() => {
    if (draftPost && !postId) {
      setPostContent(draftPost.content);
      const savedColor = temporaryColors.find(
        (c) => c.name === draftPost.color
      );
      if (savedColor) setSelectedColor(savedColor);
      if (draftPost.emoji) setSelectedEmoji(draftPost.emoji);
      if (draftPost.recipient_user_id)
        setSelectedRecipientId(draftPost.recipient_user_id);
      if (draftPost.username && typeof draftPost.username === 'string') 
        setUserUsername(draftPost.username);
      if (draftPost.formatting) setFormats(formats);
    }
  }, []);

  /*useFocusEffect(
     useCallback(() => {

        return () => {
          if (postId) {
            setDraftPost({
              id: -1,
              clerk_id:  "",
              firstname: "",
              username: "",
              content: "",
              created_at: new Date().toISOString(),
              expires_at: "", // Let the backend calculate it or parse from selectExpirationDate if needed
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
              prompt_id: -1,
              prompt: "",
              board_id: -1,
              reply_to: 0,
              unread: false,
            });
          }
    }}, [postId])
    );*/

  const navigationControls = [
    {
      icon: icons.back,
      label: "Back",
      onPress: () => {
        playSoundEffect(SoundType.Navigation)
        Haptics.selectionAsync();
        router.back();
      },
    },
    {
      icon: icons.send,
      label: "New Post",
      onPress: async () => {
        playSoundEffect(SoundType.Navigation)
        Haptics.selectionAsync();
        if (selectedTab == "customize") {
          handleSubmitPost(user!.id, draftPost);
        } else {
          setSelectedTab("customize");
        }
      },

      isCenter: true,
    },
    {
      icon: icons.settings,
      label: "More",
      onPress: () => {
        playSoundEffect(SoundType.Navigation)
        Haptics.selectionAsync();
        // Add additional logic if needed
      },

      isCenter: true,
    },
  ];

  const handleTabChange = (tabKey: string) => {
    setSelectedTab(tabKey);
  };

  const backgroundColor = useSharedValue(selectedColor?.hex || "rgba(0, 0, 0, 0.5)");
  const prevColor = React.useRef(backgroundColor.value);


  useEffect(() => {
    if (prevColor.current !== (selectedColor?.hex || "rgba(0, 0, 0, 0.5)")) {
      backgroundColor.value = withTiming(
        selectedColor?.hex || "rgba(0, 0, 0, 0.5)",
        {
          duration: 300,
          easing: Easing.inOut(Easing.quad)
        }
      );
      prevColor.current = selectedColor?.hex || "rgba(0, 0, 0, 0.5)";
    }
  }, [selectedColor]);

    const animatedBackgroundStyle = useAnimatedStyle(() => ({
      backgroundColor: backgroundColor.value,

    }))

    useEffect(() => {
      setIsEmojiSelectorVisible(false)
      setQuickEmojiSelectorVisible(false)
    }, [selectedEmoji])

  return (
    <Animated.View className="flex-1"
    style={[
      animatedBackgroundStyle
    ]}>
        <TouchableWithoutFeedback
          onPress={() => Keyboard.dismiss()}
          onPressIn={() => Keyboard.dismiss()}
         className="bg-red-500"
        >

          <View className="flex-1" >

          <Header
          title={
            postId ? 'Edit Post' :
            (prompt ? `${prompt}`:
              (recipientId ? `@${userUsername}` : 'New Post')
            )}
           />

            <TouchableWithoutFeedback
                      onPress={() => Keyboard.dismiss()}
                      onPressIn={() => Keyboard.dismiss()}
                    >
           <View className="flex-1  mt-0 overflow-hidden "
             style={[
              animatedBackgroundStyle
            ]}>
              <View className="flex-1 ">
                <KeyboardAvoidingView behavior="padding" className="flex-1 flex w-full">


                <RichTextInput
                style={textStyling}
                refresh={refreshingKey}
                exportStyling={handleChangeFormat}
                exportText={handleChangeText} />






                            </KeyboardAvoidingView>
                            </View>

              <View  className="flex-1 flex-col items-center justify-center gap-2 absolute p-4 mt-4 right-0" >
               <View>
              <ColorPickerSlider
                colors={temporaryColors}
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
                    onPress={() => setQuickEmojiSelectorVisible((prev) => !prev)}
                    //onPress={toggleEmojiSelector} 
                    size={"sm"}
                    styling="shadow-md"              />
                    </View>
                    {isQuickEmojiSelectorVisible && 
                    <View>
                      <EmojiShorthand 
                      onEmojiSelected={(emoji: string) => handleEmojiSelect(emoji)} />
                      </View>
                      }
                       {isQuickEmojiSelectorVisible && <View>
                       <InteractionButton 
                    label=""
                    icon={icons.add}
                    emoji={""}
                    showLabel={false}
                    color={"#C1C1C1"}
                    onPress={toggleEmojiSelector} 
                    size={"sm"}
                    styling="shadow-md"              />
                    </View>}
                    </View>
              </View>
              </View>
            </View>
          </TouchableWithoutFeedback>

        {selectedTab == "customize" && (
          <View className="absolute top-8">
            <PostContainer
              selectedPosts={[draftPost]}
              handleCloseModal={() => {}}
              isPreview={true}
            />
          </View>
        )}

        <CustomButtonBar buttons={navigationControls} />

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
      {isModalVisible && (
        <ModalSheet
          title="Find a user"
          isVisible={isModalVisible}
          onClose={() => {
            setIsModalVisible(false);
          }}
        >
          <FindUser selectedUserInfo={selectedUserInfo} />
        </ModalSheet>
      )}
      <KeyboardOverlay>
        <RichTextEditor handleApplyStyle={applyStyle} />
      </KeyboardOverlay>
      </Animated.View>
  );
};

const FindUser = ({ selectedUserInfo }: { selectedUserInfo: (info: UserNicknamePair) => void }) => {
  const { user } = useUser();

  const [users, setUsers] = useState<UserNicknamePair[]>([]);
  const [friendList, setFriendList] = useState<UserNicknamePair[]>([]);
  const [searchText, setSearchText] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  console.log("Modal Showed")
  useEffect(() => {
    fetchUsers();
    fetchFriendList();
  }, [])

  const fetchFriendList = async () => {
    const data = await fetchFriends(user!.id);
    console.log("friend", data)
    const friend = data.map((f: any) => [f.friend_id, f.friend_username])
    setFriendList(friend);
  };

  const fetchUsers = async () => {
          setLoading(true);
          try {
            const response = await fetchAPI(`/api/chat/searchUsers?id=${user!.id}`, {
              method: "GET",
            });
            if (response.error) {
              throw new Error(response.error);
            }
            const nicknames = response.data;
            setUsers(nicknames);
            return;
          } catch (err) {
            console.error("Failed to fetch user data:", err);
            setError("Failed to fetch nicknames.");
          } finally {
            setLoading(false);
          }
        };

     const renderUser = ({
        item,
      }: {
        item: UserNicknamePair;
      }): React.ReactElement => (
              <ItemContainer
              label={item[1]}
              colors={["#FBB1F5", "#CFB1FB"]}
              icon={icons.addUser}
              actionIcon={icons.chevron}
              iconColor="#000"
              onPress={() => {
                selectedUserInfo(item)
              }}
              />
      );

      const filteredUsers =
      searchText.length > 0
        ? users.filter(
            (user) =>
              user[1] && user[1].toLowerCase().includes(searchText.toLowerCase())
          )
        : [];

      return (
         <View>
                    <View className="flex-grow mt-4 mx-4">
                                    <TextInput
                                      className="w-full h-12 px-3 -pt-1 bg-[#F1F1F1] rounded-[16px] text-[12px] focus:outline-none focus:border-blue-500 focus:ring-blue-500"
                                      placeholder="Search users..."
                                      placeholderTextColor="#888"
                                      value={searchText}
                                      onChangeText={(text): void => setSearchText(text)}
                                    />
                                  </View>
                                  {loading ? (
                                                 <View className="flex-1 items-center justify-center">
                                                 <ColoreActivityIndicator text="Summoning Bob..." />
                                                 </View>
                                              ) : error ? (
                                                <Text>{error}</Text>
                                              ) : (
                                                <FlatList
                                                className={`mt-4 pb-4`}
                                                contentContainerStyle={{ paddingBottom: 80 }}
                                                  data={filteredUsers.length > 0 ? filteredUsers : friendList}
                                                  renderItem={renderUser}
                                                  keyExtractor={(item): string => String(item[0])}
                                                  showsVerticalScrollIndicator={false}
                                                />
                                              )}
                    </View>
      )
  }

export default NewPost;

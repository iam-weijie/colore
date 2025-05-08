import { SignedIn, useUser } from "@clerk/clerk-expo";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
} from "react-native";
import EmojiSelector from "react-native-emoji-selector";

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

const NewPost = () => {
  const playClickSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("assets/sounds/pop.mp3")
      );
      await sound.playAsync();
    } catch (error) {
      console.error("Failed to play click sound:", error);
    }
  };

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
    useState<string>(recipientId);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userUsername, setUserUsername] = useState<string>(username);
  const [postContent, setPostContent] = useState<string>(content);
  const [inputHeight, setInputHeight] = useState(40);
  const maxCharacters = 3000;
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
    temporaryColors.find((c) => c.name === color) ??
      temporaryColors[Math.floor(Math.random() * 4)]
  );
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(emoji);
  const [isEmojiSelectorVisible, setIsEmojiSelectorVisible] = useState(false);
  const [textStyling, setTextStyling] = useState<TextStyle | null>(null);
  const [refreshingKey, setRefreshingKey] = useState<number>(0);
  const [formats, setFormats] = useState<Format[]>([]);

  const [selectExpirationDate, setSelectExpirationDate] =
    useState<string>(expiration);

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

  const toggleEmojiSelector = () => {
    setIsEmojiSelectorVisible((prev) => !prev);
    // console.log(selectedEmoji);
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
      setPostContent(content);
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
      prompt: prompt ?? "",
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
      if (draftPost.username) setUserUsername(draftPost.username);
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
        playClickSound();
        Haptics.selectionAsync();
        router.back();
      },
    },
    {
      icon: icons.send,
      label: "New Post",
      onPress: async () => {
        playClickSound();
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
        playClickSound();
        Haptics.selectionAsync();
        // Add additional logic if needed
      },

      isCenter: true,
    },
  ];

  const handleTabChange = (tabKey: string) => {
    console.log("Tab changed to:", tabKey);
    setSelectedTab(tabKey);
  };

  return (
    <Animated.View className="flex-1" 
    style={{
      backgroundColor: selectedColor.hex
    }}>
        <TouchableWithoutFeedback
          onPress={() => Keyboard.dismiss()}
          onPressIn={() => Keyboard.dismiss()}
         
        >
          </TouchableWithoutFeedback>
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
            style={{
              backgroundColor: selectedColor.hex
            }}>
              <View className="flex-1 ">
                <KeyboardAvoidingView behavior="padding" className="flex-1 flex w-full">
                        <View className="flex-1 flex-column justify-center items-center  ">
              
                            
              <View className="w-full">
                <RichTextInput
                style={textStyling}
                refresh={refreshingKey}
                exportStyling={handleChangeFormat}
                exportText={handleChangeText} />
                </View>
              
                  
                         
                           
                            </View>
                            
                            </KeyboardAvoidingView>
                            </View>

              <View  className="flex-1 flex-col items-end absolute p-4 right-0" >
              <ColorPickerSlider
                colors={temporaryColors}
                selectedColor={selectedColor}
                onColorSelect={handleColorSelect}
              />
              <View className="flex flex-row items-center">
              {selectedEmoji && <TouchableOpacity
              onPress={() => {setSelectedEmoji(null)}}>
                <Image
                  source={icons.close}
                  className="w-7 h-7"
                  tintColor={'#fff'}
                  />
              </TouchableOpacity>}
              <TouchableOpacity onPress={toggleEmojiSelector}>
                {selectedEmoji ? (
                  <Text style={{ fontSize: 35, margin: 1 }}>
                    {selectedEmoji}
                  </Text>
                ) : (
                  <Image source={icons.wink} className="w-8 h-9 m-1" tintColor={'#FFFFFF'} />
                )}
              </TouchableOpacity>
              </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}
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
          <View className="w-full h-screen bg-white">
            <EmojiSelector
              onEmojiSelected={(emoji) => {
                if (emoji === selectedEmoji) {
                  setSelectedEmoji(null);
                }
                setSelectedEmoji(emoji);
              }}
            />
          </View>
        )}
      </View>
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

const FindUser = ({ selectedUserInfo }) => {
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
      const friend = data.map((f) => [f.friend_id, f.friend_username])
      setFriendList(friend);
    };
  
  const fetchUsers = async () => {
          setLoading(true);
          try {
            // //console.log("user: ", user!.id);
            const response = await fetchAPI(`/api/chat/searchUsers?id=${user!.id}`, {
              method: "GET",
            });
            if (response.error) {
              //console.log("Error fetching user data");
              //console.log("response data: ", response.data);
              //console.log("response status: ", response.status);
              // //console.log("response: ", response);
              throw new Error(response.error);
            }
            //console.log("response: ", response.data);
            const nicknames = response.data;
            //console.log("nicknames: ", nicknames);
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

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
} from "react-native";
import EmojiSelector from "react-native-emoji-selector";

import ColorSelector from "@/components/ColorSelector";
import { icons, temporaryColors } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { PostItColor, UserNicknamePair, TextStyle, Format, Post, Board } from "@/types/type";
import { useAlert } from '@/notifications/AlertContext';
import ModalSheet from "@/components/Modal";
import {
  fetchFriends
} from "@/lib/friend";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import ItemContainer from "@/components/ItemContainer";
import { useGlobalContext } from "../globalcontext";

import { CustomButtonBar } from "@/components/CustomTabBar";
import Header from "@/components/Header";
import RichTextEditor from "@/components/RichTextEditor";
import RichTextInput from "@/components/RichTextInput";
import KeyboardOverlay from "@/components/KeyboardOverlay";
import PostContainer from "@/components/PostContainer";
import { handleSubmitPost } from "@/lib/post";
import TabNavigation from "@/components/TabNavigation";
import PostGallery from "@/components/PostGallery";
import { FindUser } from "@/components/FindUsers";
import CustomButton from "@/components/CustomButton";
import CalendarView from "@/components/CalendarView";
import { format, isAfter } from "date-fns";
import RenameContainer from "@/components/RenameContainer";






const NewPost = () => {
  const { user } = useUser();
  const { postId, content, color, emoji, recipientId, username, expiration, prompt, promptId, boardId } = useLocalSearchParams();
  const { profile, setDraftPost, draftPost } = useGlobalContext();
  const { showAlert } = useAlert();

  const [selectedTab, setSelectedTab] = useState<string>("create");
  
  const [selectedUser, setSelectedUser] = useState<UserNicknamePair>();
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(recipientId);
  const [replyToPostId, setReplyToPostId] = useState<number | null>(null);
  const [isLinkHolderVisible, setIsLinkHolderVisible] = useState(false);
  const [link, setLink] = useState<string>("");
  const [userUsername, setUserUsername] = useState<string>(username);
  const [postContent, setPostContent] = useState<string>(content);
  const [inputHeight, setInputHeight] = useState(40);
  const maxCharacters = 3000;
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
    temporaryColors.find((c) => c.name === color ) ?? temporaryColors[Math.floor(Math.random() * 4)]
  );

  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(emoji);
  const [isEmojiSelectorVisible, setIsEmojiSelectorVisible] = useState(false);
  const [textStyling, setTextStyling] = useState<TextStyle | null>(null);
  const [refreshingKey, setRefreshingKey] = useState<number>(0);
  const [formats, setFormats] = useState<Format[]>([]);

  const [isSettingVisible, setIsSettingVisible] = useState(false);



  const [communityBoards, setCommunityBoards] = useState<Board[]>([])
  const [selectedExpirationDate, setSelectedExpirationDate] = useState<string>(expiration)
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>("")



  //console.log("arguments passed: ", postId, content, color, emoji, recipientId, username, expiration, prompt, promptId, boardId  )

  const tabs = [
    {name: "Create", key: "create", color: "#000"},
    {name: "Customize", key: "customize", color: "#000"}
]

  const handleColorSelect = (color: PostItColor) => {
    setSelectedColor(color);
    setIsEmojiSelectorVisible(false);
  };

  
  const applyStyle = (newStyle: TextStyle) => {
    setTextStyling(newStyle)
    setRefreshingKey((prev) => prev + 1)
    Keyboard.dismiss()
  }


  const handleChangeText = (text: string) => {
    if (text.length <= maxCharacters) {
      setPostContent(text);
    } else {
      setPostContent(text.substring(0, maxCharacters));
      showAlert({
        title: 'Limit Reached',
        message: `You can only enter up to ${maxCharacters} characters.`,
        type: 'ERROR',
        status: 'error',
      });

    }
  };

  const handleChangeFormat = (formats: Format[]) => {
    setFormats(formats)
  }

  const toggleEmojiSelector = () => {
    setIsEmojiSelectorVisible((prev) => !prev);
    // console.log(selectedEmoji);
  };

const isLink = (text: string) => {
  try {
    // Attempt to create a URL object (browser & Node.js compatible)
    new URL(text.trim());
    return true;
  } catch (e) {
    return false;
  }
}

  const selectedUserInfo = (info: UserNicknamePair) => {
    setSelectedUser(info);
    setSelectedRecipientId(info[0]);
    setUserUsername(info[1]);
  }

   useEffect(() => {
     if (selectedEmoji && isEmojiSelectorVisible) {
       toggleEmojiSelector();
     }
   }, [selectedEmoji]);
   

   useEffect(() => {
   
    if (postId) {
      setPostContent(content)
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
      formatting: formats
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
    formats
  ]);

  useEffect(() => {
     if (draftPost && !postId) {
      setPostContent(draftPost.content);
      const savedColor = temporaryColors.find(c => c.name === draftPost.color);
      if (savedColor) setSelectedColor(savedColor);
      if (draftPost.emoji) setSelectedEmoji(draftPost.emoji);
      if (draftPost.recipient_user_id) setSelectedRecipientId(draftPost.recipient_user_id);
      if (draftPost.username) setUserUsername(draftPost.username);
      if (draftPost.formatting) setFormats(formats);
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

  if (isAfter(new Date(selectedScheduleDate), new Date(selectedExpirationDate))) {
      showAlert({
      title: 'Error',
      message: `Schedule date must be before expiration date`,
      type: 'ERROR',
      status: 'error'
    });
    setSelectedExpirationDate("")
  }  else {
    showAlert({
      title: 'Success',
      message: `Scheduled for ${format(new Date(selectedScheduleDate), 'MMMM do')} and expires on ${format(new Date(selectedExpirationDate), 'MMMM do')}`,
      type: 'SUCCESS',
      status: 'success',
    });
  }
}, [selectedScheduleDate, selectedExpirationDate]);

  const navigationControls =  [
          {
            icon: icons.back,
            label: "Back",
            onPress: () => router.back(),
          },
          {
            icon: icons.send,
            label: "New Post",
            onPress: async () => {
              if (selectedTab == "customize") {
              handleSubmitPost(user!.id, draftPost)
              } else {setSelectedTab("customize")}
            },
            isCenter: true,
          },
          {
            icon: icons.settings,
            label: "More",
            onPress:() => setIsSettingVisible(prev => !prev),
            isCenter: true,
          },
        ]


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
    const { userInfo, posts } = response
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
        component: <ItemContainer
        label={selectedUser ? (selectedUser[1] === profile.username ? "Youself" : selectedUser[1] ) : "Select recipient"}
        caption={selectedUser ? `Sending this to ${selectedUser[1]}` : "Add recipient to this post"}
        icon={icons.addUser}
        colors={[selectedColor.foldcolorhex, selectedColor.hex]}
        iconColor="#000"
        onPress={() => setSelectedSetting("Recipient")}
        actionIcon={selectedRecipientId && icons.check}
      />},
      {
        label: "Board",
        component: <ItemContainer
        label="Select a board"
        caption="Add this post to a board"
        icon={icons.addUser}
        colors={[selectedColor.foldcolorhex, selectedColor.hex]}
        iconColor="#000"
        onPress={() => setSelectedSetting}
      />},
      { label: "Schedule",
        component: <ItemContainer
        label={selectedScheduleDate ? `Set for ${format(new Date(selectedScheduleDate), 'MMMM do')}` : "Schedule"}
        caption={selectedScheduleDate ? "Modify scheduled date" : "Schedule this post for later."}
        icon={icons.chevron}
        colors={[selectedColor.foldcolorhex, selectedColor.hex]}
        iconColor="#000"
        actionIcon={selectedScheduleDate && icons.check}
        onPress={() => setSelectedSetting("Schedule")}
      />},
      {label: "Expiration",
        component: <ItemContainer
        label={selectedExpirationDate ? `Expires on ${format(new Date(selectedExpirationDate), 'MMMM do')}` : "Expiration"}
        caption={selectedExpirationDate ? "Modify the expiration date" : "Set an expiration date for this post"}
        icon={icons.timer}
        colors={[selectedColor.foldcolorhex, selectedColor.hex]}
        iconColor="#000"
        actionIcon={selectedExpirationDate && icons.check}
        onPress={() => setSelectedSetting("Expiration")}
      />},
      {label: "Reply",
        component: <ItemContainer
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
        />}

]

const menuOptions = promptId ? allOptions.filter(option => option.label !== "Recipient") : ((!recipientId && !boardId && !expiration) ? allOptions.filter(option => option.label !== "Recipient" && option.label !== "Mentions" && option.label !== "Board") : (recipientId ? allOptions.filter(option => option.label !== "Board") : allOptions.filter(option => option.label !== "Recipient")));
  


return (
    <ModalSheet
      title="Settings"
      isVisible={true}
      onClose={() => {
        setIsSettingVisible(false)
        setSelectedSetting("")}}
    >
      <View className="flex-1 h-full">
           
        {!selectedSetting ? (<FlatList
          data={menuOptions}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => item.component}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />) : selectedSetting == "Reply" ? (
          <View className="flex-1">
            <View className="flex-1">
            <PostGallery 
            posts={userPosts} 
            profileUserId={""}
            disableModal
            handleUpdate={(id: number) => {
              setReplyToPostId(id)
              setSelectedSetting("")
              }} />
              </View>
                {replyToPostId && <TouchableOpacity
                      onPress={() => {
                        setReplyToPostId(null)
                        setSelectedSetting("");
                      }}
                      className="w-full mt-4 flex-row items-center justify-center"  
                    > 
                      <Text className="text-[14px] font-Jakarta font-regular text-gray-400">
                        Remove reply
                      </Text>
                    </TouchableOpacity>}
          </View>
        ) : selectedSetting == "Recipient" ? (
          <View className="flex-1">
            <FindUser selectedUserInfo={(item: UserNicknamePair) => {
              selectedUserInfo(item)
              setSelectedRecipientId(item[0])
              setSelectedSetting("")}} />
              <TouchableOpacity
                      onPress={() => {
                        setSelectedRecipientId(user!.id)

                    
                        setUserUsername("Yourself");
                        setSelectedUser([user!.id, profile.username]);
                        setSelectedSetting("");
                      }}
                      className="w-full h-6 flex-row items-center justify-center"  
                    > 
                      <Text className="text-[14px] font-Jakarta font-regular text-gray-400">
                        Keep it private
                      </Text>
                    </TouchableOpacity>
          </View>
        ) : ["Schedule", "Expiration"].includes(selectedSetting) ? (
          <View className="flex-1">
            <CalendarView onDateSelect={selectedSetting === "Schedule" ? (selected: Date) => {
              setSelectedScheduleDate(selected.toISOString())
              setSelectedSetting("")
            } : (selected: Date) => {
              setSelectedExpirationDate(selected.toISOString())
              setSelectedSetting("")
            }}
            selectedDate={
              selectedSetting === "Schedule"
                ? (selectedScheduleDate ? new Date(selectedScheduleDate) : null)
                : (selectedExpirationDate ? new Date(selectedExpirationDate) : null)
            } 
            startDate={selectedSetting === "Expiration" && selectedScheduleDate ? new Date(selectedScheduleDate) : new Date()}/>
            </View>
        ) : (
          <View>
            </View>
        )}
        </View>
      {selectedSetting && <View className="flex items-center w-full">
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedSetting("");
                      }}
                      className="w-full h-12  rounded-[16px] flex-row items-center justify-center"  
                    > 
                      <Text className="text-[16px] font-JakartaSemiBold font-medium text-black">
                        Back
                      </Text>
                    </TouchableOpacity>
                    </View>}
      </ModalSheet>
  )
}

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
    <KeyboardOverlay>
      <TextInput 
        ref={inputRef}
        className="w-[90%] h-12 rounded-[16px] bg-gray-100 p-4 text-[16px] font-Jakarta"
        placeholder="Paste your link here"
        value={link}
        onChangeText={setLink}
        onSubmitEditing={() => {
          if (isLink(link)) {
            setIsLinkHolderVisible(false);
            setPostContent(prev => `${prev}\n${link}`);
            setLink("");
          } else {
            showAlert({
              title: 'Invalid Link',
              message: 'Please enter a valid URL.',
              type: 'ERROR',
              status: 'error',
            });
          }
        }}
        autoFocus={false}
        keyboardType="url"
        returnKeyType="done"
      />
    </KeyboardOverlay>
  );
};

  return (
    <View className="flex-1" 
    style={{
      backgroundColor: selectedColor.hex,
    }}>
   
          <View className="flex-1" >
             
          <Header
          title={
            postId ? 'Edit Post' : 
            (prompt ? `${prompt}`: 
              (recipientId ? `@${userUsername}` : 'New Post')
            )}
            tabs={tabs}
            selectedTab={selectedTab}
            onTabChange={handleTabChange}
            tabCount={0}
           />
            
            
           {selectedTab == "create" && <TouchableWithoutFeedback
                      onPress={() => Keyboard.dismiss()}
                      onPressIn={() => Keyboard.dismiss()}
                    ><View className="flex-1  mt-0 overflow-hidden " 
            style={{
              backgroundColor: selectedColor.hex
            }}>
              <View className="flex-1 ">
                <KeyboardAvoidingView behavior="padding" className="flex-1 flex w-full">
                        <View className="flex-1 flex-column justify-start items-center  ">
              
                            
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
              <ColorSelector
                colors={temporaryColors}
                selectedColor={selectedColor}
                onColorSelect={handleColorSelect}
                //onColorSelect={setSelectedColor}
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
              </View></TouchableWithoutFeedback>}
            {selectedTab == "customize" && 
            <View className="absolute top-8">
              <PostContainer
              selectedPosts={[draftPost]}
              handleCloseModal={() => {}}
              isPreview={true}
              header={
                <View className="absolute z-[10] top-[19%] right-5 flex flex-row items-center justify-end gap-2">
                      <TouchableOpacity
                    onPress={() => {setIsLinkHolderVisible(true)}}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                  >
                    <Image
                      source={icons.link}
                      className="w-6 h-6"
                      tintColor={'#fff'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSelectedTab("create")}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                  >
                    <Image
                      source={icons.sparkles}
                      className="w-7 h-7"
                      tintColor={'#fff'}
                    />
                  </TouchableOpacity>
                </View>
              }
              />
            </View>}
              



              

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
          {isSettingVisible && PostSettings()}
         {isLinkHolderVisible && <LinkPlaceholder />}
          {!isLinkHolderVisible && <KeyboardOverlay>
          <RichTextEditor
                      handleApplyStyle={applyStyle}
                          />
      </KeyboardOverlay>}
       <CustomButtonBar
                            buttons={navigationControls}
                            />
      </View>
  );
};



export default NewPost;

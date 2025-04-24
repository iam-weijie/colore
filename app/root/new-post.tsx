import { SignedIn, useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

import ColorSelector from "@/components/ColorSelector";
import { LinearGradient } from 'expo-linear-gradient';
import CustomButton from "@/components/CustomButton";
import { icons, temporaryColors } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { PostItColor, UserNicknamePair, Post } from "@/types/type";
import { useNavigationContext } from "@/components/NavigationContext";
import { useAlert } from '@/notifications/AlertContext';
import ModalSheet from "@/components/Modal";
import {
  fetchFriends
} from "@/lib/friend";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import ItemContainer from "@/components/ItemContainer";
import { useGlobalContext } from "../globalcontext";

const NewPost = () => {
  const { user } = useUser();
  const { postId, content, color, emoji, recipient_id, username, expiration, prompt, promptId, boardId } = useLocalSearchParams();
  const { setDraftPost, draftPost } = useGlobalContext();
  const { showAlert } = useAlert();
  
  const [selectedUser, setSelectedUser] = useState<UserNicknamePair>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userUsername, setUserUsername] = useState<string>(username);
  const [recipientId, setRecipientId] = useState<string>(recipient_id);
  const [postContent, setPostContent] = useState<string>(content);
  const [inputHeight, setInputHeight] = useState(40);
  const maxCharacters = 3000;
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
    temporaryColors.find((c) => c.name === color ) ?? temporaryColors[Math.floor(Math.random() * 4)]
  );
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(emoji);
  const [isEmojiSelectorVisible, setIsEmojiSelectorVisible] = useState(false);


  const [selectExpirationDate, setSelectExpirationDate] = useState<string>(expiration)

  const expirationDate = ['1 day', '3 days', '7 days', '14 days']


  console.log("arguments passed: ",postId, content, color, emoji, recipient_id, username, expiration, prompt, promptId, boardId  )


  const handleColorSelect = (color: PostItColor) => {
    setSelectedColor(color);
    setIsEmojiSelectorVisible(false);
  };

  // need to get user's screen size to set a min height
  const screenHeight = Dimensions.get("screen").height;

  const handleContentSizeChange = (event: any) => {
    setInputHeight(event.nativeEvent.contentSize.height);
  };

  const handlePostSubmit = () => {
    router.push("/root/preview-post")
  };

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

  const toggleEmojiSelector = () => {
    setIsEmojiSelectorVisible((prev) => !prev);
    // console.log(selectedEmoji);
  };

  const selectedUserInfo = (info: UserNicknamePair) => {
    setSelectedUser(info);
    setRecipientId(info[0]);
    setUserUsername(info[1]);
    setIsModalVisible(false)
  }

   useEffect(() => {
     if (selectedEmoji && isEmojiSelectorVisible) {
       toggleEmojiSelector();
     }
   }, [selectedEmoji]);
   
   useEffect(()=> {
    setPostContent(content)
   }, [])
   useEffect(() => {
   
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
      recipient_user_id: recipientId ?? "",
      pinned: false,
      color: selectedColor.name,
      emoji: selectedEmoji ?? "",
      notified: false,
      prompt_id: promptId ? Number(promptId) : 0,
      prompt: prompt ?? "",
      board_id: boardId ? Number(boardId) : 0,
      reply_to: 0,
      unread: false,
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
  ]);

  useEffect(() => {
    if (draftPost) {
      setPostContent(draftPost.content);
      const savedColor = temporaryColors.find(c => c.name === draftPost.color);
      if (savedColor) setSelectedColor(savedColor);
      if (draftPost.emoji) setSelectedEmoji(draftPost.emoji);
      if (draftPost.recipient_user_id) setRecipientId(draftPost.recipient_user_id);
      if (draftPost.username) setUserUsername(draftPost.username);
    }
  }, []);

  return (
    <SafeAreaView className="flex-1" >
      <SignedIn>
        <TouchableWithoutFeedback
          onPress={() => Keyboard.dismiss()}
          onPressIn={() => Keyboard.dismiss()}
         
        >
          <View className="flex-1" >
            <View className="flex flex-row justify-between items-center my-6 mx-8">
            <View className="flex flex-row w-full justify-between items-center ">
                <TouchableOpacity onPress={() => {
                  setDraftPost(null);
                  router.back()}} className="mr-2">
                  <AntDesign name="caretleft" size={18} color="black" />
                </TouchableOpacity>
                <View className="">
              <Text className="  text-center text-[18px] font-JakartaBold text-black">
                {postId ? 'Edit Post' : 'New Post'}
              </Text>
              </View>
              
               
              

              
              {!!username ? (
                  <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setTimeout(() => setIsModalVisible(true), 100);
                  }
                    }>
                  <Image
                  source={icons.addUser}
                  className="w-5 h-5"
                  tintColor={"#000"} />
                  </TouchableOpacity>
                )  : prompt ? (
                  <TouchableOpacity
                  activeOpacity={0.9} 
                  onPress={() => {
                    // handle other condition
                  }}>
                    <Image
                      source={icons.fire}
                      className="w-6 h-6"
                      tintColor="#000"
                    />
                  </TouchableOpacity>
                )   : (
                  <TouchableOpacity
                  activeOpacity={expiration ? 0.6 : 1}
                  style={{
                    opacity: expiration ? 1 : 0
                  }}
                  onPress={() => {
                    if (expiration) {
                    const currentIndex = expirationDate.indexOf(selectExpirationDate);
                    if (currentIndex < expirationDate.length - 1) {
                      setSelectExpirationDate(expirationDate[currentIndex + 1])
                    } else {
                      setSelectExpirationDate(expirationDate[0])
                    }
                  }
                  }}>
                                      <Image
                                      source={icons.timer}
                                      className="w-6 h-6"
                                      tintColor={"#000"} />
                                      {!postId && <Text className="absolute top-1 right-4 flex-1 w-full min-w-[75px]  text-center text-[12px] font-JakartaSemiBold text-gray-400" >
                  {selectExpirationDate}
                 </Text>}
                 </TouchableOpacity>
                 
                )
                }
              
              {/*<CustomButton
                className="w-14 h-10 rounded-full shadow-none"
                fontSize="sm"
                title="Next"
                style={{backgroundColor: selectedColor.hex}}
                padding="0"
                onPress={handlePostSubmit}
                disabled={!postContent || isPosting}
              />*/}
            </View>
         
            </View>

            {prompt && <View className="my-6 mx-10">
              <Text className="text-[24px] text-center font-JakartaBold text-black">
                {prompt}
                </Text>
            </View>}

           <View className="flex-1 mx-6 mt-0 rounded-[48px] overflow-hidden shadow-sm border-4" 
            style={{
              backgroundColor: selectedColor.hex,
              borderColor: "#ffffff80",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
            }}>
            <KeyboardAvoidingView behavior="padding" className="flex-1 flex w-full">
          <View className="flex-1 flex-column justify-center items-center ">
            <View className="flex w-full mx-3">
              {!isEmojiSelectorVisible && (
                <View>
                <TextInput
                  className="text-[20px] text-white p-5 rounded-[24px] font-JakartaBold mx-10 "
                  placeholder="Type something..."
                  value={postContent}
                  onChangeText={handleChangeText}
                  onContentSizeChange={handleContentSizeChange}
                  autoFocus
                  multiline
                  scrollEnabled
                  style={{
                    paddingTop: 10,
                    paddingBottom: 0,
                    minHeight: screenHeight * 0.2,
                    maxHeight: screenHeight * 0.5,
                    textAlignVertical: "top",
                  }}
                />
                </View>
              )}
            </View>
    
           
             
              </View>
              
              </KeyboardAvoidingView>
              <View className="flex-1 absolute m-4 left-4 top-2" >
                <Text className="text-[16px] font-JakartaBold text-white">{userUsername ? `To: ${userUsername}` : ''}</Text>
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
              </View>
              <View className="flex-1 absolute flex items-center w-full bottom-[10%]">
            <CustomButton
              className="w-[50%] h-16 rounded-full shadow-none bg-black"
              fontSize="lg"
              title={prompt ? "submit" : "continue"}
              padding="0"
              onPress={handlePostSubmit}
              disabled={!postContent}
            />
            </View>

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
        </TouchableWithoutFeedback>
        {isModalVisible &&
        <ModalSheet
        title="Find a user"
        isVisible={isModalVisible}
         onClose={() => {setIsModalVisible(false)}}>
           <FindUser selectedUserInfo={selectedUserInfo} />
          </ModalSheet>}
      </SignedIn>
      </SafeAreaView>
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

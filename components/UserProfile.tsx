import { useNavigationContext } from "@/components/NavigationContext";
import { useGlobalContext } from "@/app/globalcontext";
import PostGallery from "@/components/PostGallery";
import { icons, temporaryColors } from "@/constants/index";
import { FriendStatus } from "@/lib/enum";
import { fetchAPI } from "@/lib/fetch";
import axios from "axios";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  fetchFriends,
  fetchFriendStatus,
  unfriend,
} from "@/lib/friend";
import {
  FriendStatusType,
  Post,
  UserData,
  UserNicknamePair,
  UserProfileProps,
  UserProfileType,
} from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { SlideInDown, SlideInUp, FadeInDown, FadeIn } from "react-native-reanimated";
import ColorGallery from "./ColorGallery";
import DropdownMenu from "./DropdownMenu";
import TabNavigation from "./TabNavigation";
import { useAlert } from '@/notifications/AlertContext';
import Circle from "./Circle";
import Settings from "@/app/root/settings";
import BoardGallery from "./BoardGallery";
import PersonalBoard from "./PersonalBoard";
import PostContainer from "./PostContainer";
import ColoreActivityIndicator from "./ColoreActivityIndicator";
import TabsContainer from "./TabsContainer";
import { fetchCountryEmoji } from "@/lib/post";
import Header from "./Header";
// Skeleton component for post loading states
const PostSkeleton = () => (
  <Animated.View 
    entering={FadeIn.duration(600)}
    className="w-full px-4 my-3"
  >
    <View className="bg-gray-200 rounded-2xl w-full h-32 opacity-70" />
  </Animated.View>
);

// Skeleton UI for posts section during loading
const PostGallerySkeleton = () => (
  <Animated.View 
    entering={FadeIn.duration(400)}
    className="w-full"
  >
    <View className="w-full mx-8 flex flex-row items-center justify-between mb-4">
      <View className="w-32 h-6 bg-gray-200 rounded opacity-70" />
      <View className="w-16 h-4 bg-gray-200 rounded opacity-70" />
    </View>
    <PostSkeleton />
    <PostSkeleton />
    <PostSkeleton />
  </Animated.View>
);



const UserProfile: React.FC<UserProfileProps> = ({ userId, onSignOut }) => {
  const { user } = useUser();
  const router = useRouter();
  const { isIpad } = useGlobalContext(); 
  const { showAlert } = useAlert();


  const [nickname, setNickname] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [emojiLoading, setEmojiLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<UserProfileType | null>(null);
  const [countryEmoji, setCountryEmoji] = useState<string>("");
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [unreadComments, setUnreadComments] = useState<number>(0);
  const { stateVars, setStateVars } = useNavigationContext();

  const [myBoards, setMyBoards] = useState<any>();
  const [communityBoards, setCommunityBoards] = useState<any>();


  const [currentSubscreen, setCurrentSubscreen] = useState<string>("posts");
  const [convId, setConvId] = useState<string | null>(null);


  const [friendStatus, setFriendStatus] = useState<FriendStatusType>(
    FriendStatus.UNKNOWN
  );
  const [friendCount, setFriendCount] = useState<number>(0);
  const [isHandlingFriendRequest, setIsHandlingFriendRequest] = useState(false);
  const [isFocusedOnProfile, setIsFocusedOnProfile] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<string>("Profile");

  const [personalPosts, setPersonalPosts] = useState<Post[]>([]);
  const [disableInteractions, setDisableInteractions] = useState<boolean>(false);

  const isEditable = user!.id === userId;


  function findUserNickname(
    userArray: UserNicknamePair[],
    userId: string
  ): number {
    const index = userArray.findIndex((pair) => pair[0] === userId);
    return index;
  }

  const fetchCurrentNickname = async () => {
    try {
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`, {
        //Fetch User Color Collected
        method: "GET",
      });
      if (response.error) {
        throw new Error(response.error);
      }
      const nicknames = response.data[0].nicknames || [];
      return findUserNickname(nicknames, userId) === -1
        ? ""
        : nicknames[findUserNickname(nicknames, userId)][1];
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };
  const fetchFriendCount = async () => {
    if (user!.id === userId) {
      const data = await fetchFriends(user!.id);
      setFriendCount(data.length);
    }
  };



  // Add useFocusEffect to reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reload user data when screen is focused (e.g., after location change)
      fetchUserData();
      fetchPersonalBoards();
      fetchCommunityBoards();
      fetchPersonalPosts();
      // Reload nickname data
      const getData = async () => {
        const data = await fetchCurrentNickname();
        setNickname(data);
      };
      getData();
      
      return () => {
        // Cleanup if needed
      };
    }, [userId, stateVars])
  );

  useEffect(() => {
    const getData = async () => {
      const data = await fetchCurrentNickname();
      setNickname(data);
    };
    getData();
  }, [stateVars]);

  useEffect(() => {
      const getFriendStatus = async () => {
        let status;
        if (user!.id !== userId) {
          status = await fetchFriendStatus(userId, user!);
          //console.log("Friend status:", status.name);
          setFriendStatus(status);
        }
      };
      getFriendStatus();
      fetchFriendCount();
    }, []);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAPI(
        `/api/posts/getUserPosts?id=${userId}`,
        {
          method: "GET",
        }
      );
      if (response.error) {
        throw new Error(response.error);
      }
      const { userInfo, posts } = response as UserData;
      const unread_comments = posts.reduce((acc, post) => acc + (post.unread_comments ?? 0), 0);
      setUnreadComments(unread_comments);
      setProfileUser(userInfo);
      setUserPosts(posts);


      // Fetch country emoji
      setEmojiLoading(true)
      const flagEmoji = await fetchCountryEmoji(userInfo.country);
      console.log("country emoji", flagEmoji)
      setCountryEmoji(() => flagEmoji)
      setEmojiLoading(false)
    } catch (error) {
      setError("Failed to fetch user data.");
      console.error("Failed to fetch user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const post = {
    id: -1,
    clerk_id: userId,
    user_id: userId, // this is supposed to be a temporary fix to prevent weird type mismatch errors
    firstname: "",
    username: "",
    content: "Hi, I am a new Colore User!",
    created_at: "",
    expires_at: "",
    city: "",
    state: "",
    country: "",
    like_count: 0,
    report_count: 0,
    unread_comments: 0,
    recipient_user_id: "",
    pinned: true,
    color: "yellow", //String for now. Should be changed to PostItColor
    emoji: "",
    notified: true,
    prompt_id: -1,
    prompt: "",
    board_id: 0,
    reply_to: -1,
  }

  const fetchPersonalBoards = async () => {
    setProfileLoading(true)
      try {
        
        const response = await fetchAPI(`/api/boards/getBoards?user_id=${userId}`,
            {
              method: "GET",
            }
        )
        if (response.error) {
          throw new Error(response.error);
        }
  
        const personalBoard =  {
          id: 0,
          title: "Personal Board",
          user_id: userId,
          description: "Your window to the world!",
          members_id: [userId],
          board_type: 'personal',
          restrictions: ['personal', 'commentsAllowed', '5'],
          created_at: Date.now(),
          color: "#93c5fd"
        }

        const checkForPrivacy = response.data.filter((b) => b.restrictions.includes("Everyone"))
  
          if (isEditable && response.data) {
            const boardsWithColor = response.data.map((board: any, index: number) => ({
              ...board,
              color: temporaryColors[Math.floor(Math.random() * 4)].hex, // only assign if not already set
            }));
          
            setMyBoards([...boardsWithColor, personalBoard]);
          } else if (!isEditable && response.data) {
            const boardsWithColor = checkForPrivacy.map((board: any, index: number) => ({
              ...board,
              color: temporaryColors[Math.floor(Math.random() * 4)].hex, // only assign if not already set
            }));
          
            setMyBoards([...boardsWithColor, personalBoard]);
          } else {
           
            setMyBoards(personalBoard)
          }
  
      } catch (error) {
        console.error("Failed to fetch board data:", error);
      } finally {
        setProfileLoading(false)
      }
    }

  const fetchCommunityBoards = async () => {
      try {
        setLoading(true)
        const response = await fetchAPI(`/api/boards/getCommunityBoards?user_id=${userId}`,
            {
              method: "GET",
            }
        )
        if (response.error) {
          throw new Error(response.error);
        }
  
  
        
            const boardsWithColor = response.data.map((board: any, index: number) => ({
              ...board,
              color: temporaryColors[Math.floor(Math.random() * 4)].hex, // only assign if not already set
            }));
          
            setCommunityBoards(boardsWithColor);
  
          
  
      } catch (error) {
        console.error("Failed to fetch board data:", error);
      } finally {
        setLoading(false)
      }
    }

  const fetchPersonalPosts = async () => {
      const response = await fetchAPI(
        `/api/posts/getPersonalPosts?number=${8}&recipient_id=${userId}&user_id=${user!.id}`
      );
  
      const filteredPosts = response.data.filter((p) => p.pinned)
      
      if (filteredPosts.length == 0 || response.length == 0) {
        setDisableInteractions(true)

        setPersonalPosts([post])

      } else {
        setPersonalPosts(filteredPosts)
      }
     
  
    }
  

  useEffect(() => {
    fetchUserData();
  }, [isFocusedOnProfile]);



  const handleAddNickname = () => {
    setStateVars({
      ...stateVars,
      previousScreen: "profile",
      userId,
    });
    router.push("/root/profile/nickname");
  };




  const handleSendFriendRequest = async () => {
    try {
      setIsHandlingFriendRequest(true);
      await fetchAPI(`/api/friends/newFriendRequest`, {
        method: "POST",
        body: JSON.stringify({
          clerkId: user!.id,
          friendId: userId,
        }),
      });
      showAlert({
        title: 'Friend request sent!',
        message: "You have sent a friend request to this user.",
        type: 'FRIEND_REQUEST',
        status: 'success',
      });
      setFriendStatus(FriendStatus.SENT);
      setIsHandlingFriendRequest(false);
    } catch (error) {
      console.error("Failed to send friend request:", error);
      showAlert({
        title: 'Error',
        message: `Error sending friend request.`,
        type: 'ERROR',
        status: 'error',
      });
    }
  };


const myTabs = [
  { name: "Profile", key: "Profile", color: "#CFB1FB", notifications: 0 },
  { name: "Posts", key: "Posts", color: "#CFB1FB", notifications: unreadComments },
  { name: "Settings", key: "Settings", color: "#93c5fd", notifications: 0 }
];

const userTabs = [
  { name: "Profile", key: "Profile", color: "#CFB1FB", notifications: 0 },
  { name: "Boards", key: "Boards", color: "#CFB1FB" },
  { name: "Communities", key: "Communities", color: "#93c5fd", notifications: 0 }
];

const handleTabChange = (tabKey: string) => {
  console.log("Tab changed to:", tabKey);
  setSelectedTab(tabKey);
  // You can add additional logic here when tabs change
};

  return (
    <View className="absolute w-full h-full flex-1 bg-[#FAFAFA]">

            

           {/* HEADER */}
           <Header 
        title=""
        item={
          <View className="flex-row w-full  justify-between items-center pl-10 pr-6">
          <Animated.View entering={FadeIn.duration(800)}>
          { (nickname || profileUser?.username) ? (
          
             <Text className={`text-2xl font-JakartaBold`}>
              {nickname
                ? nickname
                : profileUser?.username
                  ? `${profileUser?.username}`
                  : `${profileUser?.firstname?.charAt(0)}.`} {emojiLoading ? "" : countryEmoji}
            </Text> 
          ) : 
           <Text className={`text-2xl bg-[#E7E5Eb] text-[#E7E5Eb] font-JakartaBold`}>Username</Text>
           }
              { profileUser ?  (<View className="max-w-[200px]">
          <Text className=" text-xs text-gray-600 text-left font-Jakarta">
              {profileUser?.city == profileUser?.state ? "" : `${profileUser?.city}, `}{profileUser?.state},{" "}
              {profileUser?.country}
            </Text> 
          </View>) : (
            <View>
            <Text className="text-[14px] text-gray-700 bg-[#E7E5Eb] text-center font-Jakarta"> Location updating... </Text>
            </View>)}
          </Animated.View>
          
          {isEditable ? (
            <View className="flex-row gap-6 mr-7">
              <View>
              <Text className="text-lg font-JakartaSemiBold">
                {userPosts.length}
              </Text>
              <Text className="text-xs font-JakartaSemiBold">
                Posts
              </Text>
              </View>
              <View className="flex-column items-start justify-center">
              <Text className="text-lg font-JakartaSemiBold">
                {friendCount}
              </Text>
              <Text className="text-xs font-JakartaSemiBold">
                Friends
              </Text>
              </View>
          </View>) :
          (<TouchableOpacity
          onPress={async () => {
            if (user!.id === userId) {
              //router.push("/root/chat/chat-screen");
            }
            if (
              (user!.id !== userId && friendStatus.name === "unknown") ||
              friendStatus.name === "none"
            ) {
              handleSendFriendRequest();
            }
            if (user!.id !== userId && friendStatus.name === "received") {
              setIsHandlingFriendRequest(true);
              const response = await acceptFriendRequest(
                profileUser!.clerk_id,
                user!.id
              );
              if (response === FriendStatus.FRIENDS) {
                showAlert({
                  title: 'New friend!',
                  message: "You have accepted this friend request.",
                  type: 'FRIEND_REQUEST',
                  status: 'success',
                });
              } else {
                showAlert({
                  title: 'Error',
                  message: `Error accepting this friend request.`,
                  type: 'ERROR',
                  status: 'error',
                });
              }
              setFriendStatus(response);
              setIsHandlingFriendRequest(false);
            }
            if (user!.id !== userId && friendStatus.name === "sent") {
              setIsHandlingFriendRequest(true);
              const response: FriendStatusType =
                await cancelFriendRequest(user!.id, userId);
              if (response === FriendStatus.NONE) {
                showAlert({
                  title: 'Cancelled',
                  message: "Friend request cancelled.",
                  type: 'UPDATE',
                  status: 'success',
                });
              } else {
                showAlert({
                  title: 'Error',
                  message: `Error cancelling this friend request.`,
                  type: 'ERROR',
                  status: 'error',
                });
              }
              setFriendStatus(response);
              setIsHandlingFriendRequest(false);
            }
            if (user!.id !== userId && friendStatus.name === "friends") {
              router.push({  
                pathname: "/root/new-post",
                params: {
                  recipient_id: userId,
                  username: profileUser?.username,
                  source: "board"
                },
            })
            }
          }}
          className="items-center justify-between px-4"
          style={{
            backgroundColor: user!.id === userId ? "#93c5fd" : "#000000",
            justifyContent:
              user!.id === userId ? "space-between" : "center",
            padding: user!.id === userId ? 20 : 5,
            height: 40,
            borderRadius: user!.id === userId
                ? 24
                : 16,
          }}
        >

         
          {user!.id === userId && (
            <View>
              <Text className="text-white font-JakartaBold text-sm">
                Friends
              </Text>
            </View>
          )}
          {user!.id !== userId && friendStatus.name === "unknown" && (
            <View>
              <Text className="text-white font-JakartaBold text-sm">
                Add friend
              </Text>
            </View>
          )}
          {user!.id !== userId &&
            friendStatus.name !== "friends" &&
            friendStatus.name === "none" && (
              <View>
                <Text className="text-white font-JakartaBold text-sm">
                  Add friend
                </Text>
              </View>
            )}
          {user!.id !== userId &&
            friendStatus.name !== "friends" &&
            friendStatus.name === "sent" && (
              <View>
                <Text className="text-white font-JakartaBold text-sm">
                  Cancel request
                </Text>
              </View>
            )}
          {user!.id !== userId &&
            friendStatus.name !== "friends" &&
            friendStatus.name === "received" && (
              <View>
                <Text className="text-white font-JakartaBold text-sm">
                  Accept request
                </Text>
              </View>
            )}
          {user!.id !== userId && friendStatus.name === "friends" && (
            <View>
              <Text className="text-white font-JakartaBold text-sm">
                Message
              </Text>
            </View>
          )}
        </TouchableOpacity>)}
        </View>
        }
        tabs={isEditable ? myTabs : userTabs}
        selectedTab={selectedTab}
        onTabChange={handleTabChange} 
        tabCount={0}    />

           
            

            {/* TABS */}
            
            {selectedTab === "Profile" && <View className="flex-1 items-center justify-center">
              {!profileLoading ? (
                <View className={`absolute -top-[20%] ${isIpad ? 'left-[60]' : 'left-[19]'} -mt-[15px]`}>
                  <PostContainer selectedPosts={personalPosts} handleCloseModal={() => {}} isPreview={disableInteractions}/></View>)
              : (
                <View className={`absolute -top-[20%] ${isIpad ? 'left-[60]' : 'left-[19]'} -mt-[15px]`}>
                  <PostContainer selectedPosts={[post]} handleCloseModal={() => {}} isPreview={disableInteractions}/></View>
              )}
            </View>}

            {selectedTab === "Posts" && <View className="flex-1 bg-[#FAFAFA] pb-24">
              <View className="items-center mx-6">
              <TextInput
                className=" w-full h-12 px-5 rounded-[16px] bg-[#F1F1F1] mt-6"
                placeholder="Search"
                onChangeText={setQuery}
                value={query}
              />
              </View>
              {loading ? (
                  <PostGallerySkeleton />
                ) : (
                  <PostGallery
                    posts={userPosts}
                    profileUserId={user!.id}
                    handleUpdate={fetchUserData}
                    query={query}
                  />
                )}
            </View>}

            {selectedTab === "Boards" && <View className="flex-1 pt-4">
            <BoardGallery boards={myBoards} />
            </View>}

            {selectedTab === "Communities" && <View className="flex-1 pt-4">
            <BoardGallery boards={communityBoards} />
            </View>}

            {selectedTab === "Settings" && 
            <Settings />
            }
        
       

    </View>
  );
};

export default UserProfile;

/*
  const checkIfChatExists = async (user2: UserNicknamePair) => {
    try {
      // //console.log("user: ", user!.id);
      const response = await fetchAPI(
        `/api/chat/checkIfConversationExists?id1=${user!.id}&id2=${user2[0]}`,
        {
          method: "GET",
        }
      );
      if (response.error) {
        //console.log("Error fetching user data");
        //console.log("response data: ", response.data);
        //console.log("response status: ", response.status);
        // //console.log("response: ", response);
        throw new Error(response.error);
      }
      //console.log("response: ", response.data.length);
      if (response.data.length > 0) {
        setConvId(response.data[0].id);
        /*router.push(
         `/root/chat/conversation?conversationId=${response.data[0].id}&otherClerkId=${user2[0]}&otherName=${user2[1]}`
         
        );
        router.push({
          pathname: "/root/new-personal-post",
          params: {
            recipient_id: user!.id,
            source: "board"
          },
        });
      }
      return response.data.length > 0;
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      setError("Failed to fetch nicknames.");
      return false;
    }
  };
  const startChat = async (otherUser: UserNicknamePair) => {
    //console.log(`Starting chat with ${otherUser[1]}`);
    const exists = await checkIfChatExists(otherUser);
    //console.log("conversationExists: ", exists);
    if (exists) {
      //console.log("Chat already exists, sending user to conversation with Id: ", convId);
    } else {
      setLoading(true);
      try {
        const response = await fetchAPI(`/api/chat/newConversation`, {
          method: "POST",
          body: JSON.stringify({
            clerkId_1: user!.id,
            clerkId_2: otherUser[0],
          }),
        });
        if (response.error) {
          //console.log("Error creating conversation");
          //console.log("response data: ", response.data);
          //console.log("response status: ", response.status);
          // //console.log("response: ", response);
          throw new Error(response.error);
        }
        //console.log("Chat was successfully created, attempting to get conversation information to push user there");
        try {
          const result = await fetchAPI(
            `/api/chat/getConversationThatWasJustCreated?id1=${user!.id}&id2=${otherUser[0]}`,
            {
              method: "GET",
            }
          );
          if (result.error) {
            //console.log("Error fetching conversation data");
            //console.log("response data: ", result.data);
            //console.log("response status: ", result.status);
            // //console.log("response: ", response);
            throw new Error(result.error);
          } else {
            const conversation = result.data[0];
            //console.log(`Pushing user to conversation that was just created with conversation ID: ${conversation.id}`);
           router.push(
              `/root/chat/conversation?conversationId=${conversation.id}&otherClerkId=${conversation.clerk_id}&otherName=${conversation.name}`
            );
            router.push({
              pathname: "/root/new-personal-post",
              params: {
                recipient_id: user!.id,
                source: "board"
              },
            });
          }
        } catch (err) {
          console.error("Failed to fetch conversation data:", err);
          setError(
            "Chat was successfully created, but failed to send user to conversation."
          );
        }
      } catch (err) {
        console.error("Failed to create new conversation:", err);
        setError("Failed to create new conversation");
      } finally {
        setLoading(false);
      }
    }
  };
  */

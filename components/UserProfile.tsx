import { useNavigationContext } from "@/components/NavigationContext";
import PostGallery from "@/components/PostGallery";
import { icons, temporaryColors } from "@/constants/index";
import { FriendStatus } from "@/lib/enum";
import { fetchAPI } from "@/lib/fetch";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  fetchFriendStatus,
  unfriend,
  fetchFriends
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
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFocusEffect, useRouter, router } from "expo-router";
import React, { useEffect, useState,  } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ColorGallery from "./ColorGallery";
import DropdownMenu from "./DropdownMenu";

const UserProfile: React.FC<UserProfileProps> = ({ userId, onSignOut }) => {
  const { user } = useUser();
  const [nickname, setNickname] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<UserProfileType | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const { stateVars, setStateVars } = useNavigationContext();
  const router = useRouter();
  const [currentSubscreen, setCurrentSubscreen] = useState<string>("posts");
  const [convId, setConvId] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<FriendStatusType>(
    FriendStatus.UNKNOWN
  );
  const [friendCount, setFriendCount] = useState<number>(0);
  const [isHandlingFriendRequest, setIsHandlingFriendRequest] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`, { //Fetch User Color Collected
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

  useEffect(() => {
    setIsCollapsed(user!.id != userId)
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
        console.log("Friend status:", status.name);
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
        `/api/users/getUserInfoPosts?id=${userId}`,
        {
          method: "GET",
        }
      );
      if (response.error) {
        throw new Error(response.error);
      }
      const { userInfo, posts } = response as UserData;
      setProfileUser(userInfo);
      setUserPosts(posts);
    } catch (error) {
      setError("Failed to fetch user data.");
      console.error("Failed to fetch user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [userId])
  );

  const handleAddNickname = () => {
    setStateVars({
      ...stateVars,
      previousScreen: "profile",
      userId,
    });
    router.push("/root/profile/nickname");
  };

  if (loading)
    return (
      <View className="flex-[0.8] justify-center items-center">
        <ActivityIndicator size="large" color="black" />
      </View>
    );

  if (error)
    return (
      <SafeAreaView className="flex-1">
        <View className="flex flex-row items-center justify-between">
          <Text>An error occurred. Please try again Later.</Text>
          <View className="flex flex-row items-right">
            {isEditable && (
              <TouchableOpacity
                onPress={() => router.push("/root/settings")}
                className="p-2"
              >
                <Image
                  source={icons.settings}
                  className="w-8 h-8"
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
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
        router.push(
          `/root/chat/conversation?conversationId=${response.data[0].id}&otherClerkId=${user2[0]}&otherName=${user2[1]}`
        );
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
      Alert.alert("Friend request sent!");
      setFriendStatus(FriendStatus.SENT);
      setIsHandlingFriendRequest(false);
    } catch (error) {
      console.error("Failed to send friend request:", error);
      Alert.alert("Error sending friend request.");
    }
  };

  // to prevent database errors,
  // don't load the "send friend request"
  // option if the friend status can't be determined
  const menuItems_unloaded = [
    { label: "Alias", onPress: handleAddNickname },
    {
      label: "Chat",
      onPress: () =>
        startChat([
          profileUser!.clerk_id,
          nickname || profileUser!.username,
        ] as UserNicknamePair),
    },
  ];

  const menuItems_default = [
    { label: "Alias", onPress: handleAddNickname },
    {
      label: "Chat",
      onPress: () =>
        startChat([
          profileUser!.clerk_id,
          nickname || profileUser!.username,
        ] as UserNicknamePair),
    },
    {
      label: "Send friend request",
      onPress: () => {
        if (friendStatus === FriendStatus.NONE) {
          handleSendFriendRequest(); // only send if checked for sure not friends, and no request exists
        }
      },
    },
  ];

  const menuItems_friend = [
    { label: "Alias", onPress: handleAddNickname },
    {
      label: "Chat",
      onPress: () =>
        startChat([
          profileUser!.clerk_id,
          nickname || profileUser!.username,
        ] as UserNicknamePair),
    },
    {
      label: "Unfriend",
      onPress: async () => {
        setIsHandlingFriendRequest(true);
        const response: FriendStatusType = await unfriend(user!.id, userId);
        if (response === FriendStatus.NONE) {
          Alert.alert("You have unfriended this user.");
        } else {
          Alert.alert("Error unfriending this user.");
        }
        setFriendStatus(response);
        setIsHandlingFriendRequest(false);
      },
    },
  ];

  const menuItems_sent = [
    { label: "Alias", onPress: handleAddNickname },
    {
      label: "Chat",
      onPress: () =>
        startChat([
          profileUser!.clerk_id,
          nickname || profileUser!.username,
        ] as UserNicknamePair),
    },
    {
      label: "Cancel friend request",
      onPress: async () => {
        setIsHandlingFriendRequest(true);
        const response: FriendStatusType = await cancelFriendRequest(
          user!.id,
          userId
        );
        if (response === FriendStatus.NONE) {
          Alert.alert("Friend request cancelled.");
        } else {
          Alert.alert("Error cancelling friend request.");
        }
        setFriendStatus(response);
        setIsHandlingFriendRequest(false);
      },
    },
  ];

  const menuItems_received = [
    { label: "Alias", onPress: handleAddNickname },
    {
      label: "Chat",
      onPress: () =>
        startChat([
          profileUser!.clerk_id,
          nickname || profileUser!.username,
        ] as UserNicknamePair),
    },
    {
      label: "Accept friend request",
      onPress: async () => {
        setIsHandlingFriendRequest(true);
        const response = await acceptFriendRequest(
          profileUser!.clerk_id,
          user!.id
        );
        if (response === FriendStatus.FRIENDS) {
          Alert.alert("Friend request accepted!");
        } else {
          Alert.alert("Error accepting friend request.");
        }
        setFriendStatus(response);
        setIsHandlingFriendRequest(false);
      },
    },
  ];

  return (
    <View className="flex-1 mt-3">
      {query.length < 1  && <View>
      <View className="mx-7 mb-2">
        {!isEditable && (
          <View className="flex flex-row items-center justify-between pb-3">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <AntDesign name="caretleft" size={18} />
            </TouchableOpacity>
            <View className="flex flex-row items-right">
              {friendStatus === FriendStatus.FRIENDS && (
                <DropdownMenu
                  menuItems={menuItems_friend}
                  customMenuWidth={150}
                />
              )}
              {friendStatus === FriendStatus.SENT && (
                <DropdownMenu
                  menuItems={menuItems_sent}
                  customMenuWidth={150}
                />
              )}
              {friendStatus === FriendStatus.RECEIVED && (
                <DropdownMenu
                  menuItems={menuItems_received}
                  customMenuWidth={150}
                />
              )}
              {friendStatus === FriendStatus.NONE && (
                <DropdownMenu
                  menuItems={menuItems_default}
                  customMenuWidth={150}
                />
              )}
              {friendStatus === FriendStatus.UNKNOWN && (
                <DropdownMenu
                  menuItems={menuItems_unloaded}
                  customMenuWidth={150}
                />
              )}
            </View>
          </View>
        )}

          <View className="relative flex flex-row items-center justify-end">
            {isEditable && (
              <TouchableOpacity onPress={() => router.push("/root/settings")}>
                <Image source={icons.settings} className="w-8 h-8" />
              </TouchableOpacity>
            )}
          
        </View>

        <View className="p-8 flex flex-column items-center justify-center ">
        <View className="flex flex-row items-center justify-center">
          <Text className={`text-[24px] font-JakartaBold`}>
            {nickname
              ? nickname
              : profileUser?.username
                ? `${profileUser?.username}`
                : `${profileUser?.firstname?.charAt(0)}.`}
          </Text>
        </View>

        <View>
          <Text className="text-gray-500 font-Jakarta text-base">
            📍{profileUser?.city}, {profileUser?.state}, {profileUser?.country}
          </Text>
        </View>

        </View>
      </View>
      <View className="flex-row justify-around items-center space-x-8 mx-7">
        <TouchableOpacity onPress={() => {
          if (currentSubscreen === "posts") setCurrentSubscreen("colors");
          else if (currentSubscreen === "colors") setCurrentSubscreen("personal");
          else setCurrentSubscreen("posts");
          }} 
          className="flex-1 max-w-[135px] p-5 bg-gray-200 items-center justify-between" 
          style={{
            height: isCollapsed ? 60 : 150, 
            borderRadius: isCollapsed ? 24 : 32
          }}
        >
          {!isCollapsed && (
            <View className="w-full flex flex-row items-start">
              <Text className="text-[#333333] font-JakartaBold text-3xl">
                {currentSubscreen !== "colors" ? temporaryColors.length : userPosts.length}
              </Text>
            </View>
          )}
          {!isCollapsed && (
            <View>
              {currentSubscreen !== "colors" && (
                <Image
                  source={icons.palette}
                  tintColor={currentSubscreen === "colors" ? "#93c5fd" : "#333333"}
                  resizeMode="contain"
                  className="w-10 h-10 -mt-4"
                />
              )}
              {currentSubscreen !== "posts" && (
                <Image
                  source={icons.home}
                  tintColor={currentSubscreen === "posts" ? "#93c5fd" : "#333333"}
                  resizeMode="contain"
                  className="w-10 h-10 -mt-4"
                />
              )}
            </View>
          )}
          <View>
            {currentSubscreen !== "colors" && (
              <Text className="text-[#333333] font-JakartaBold text-[16px]">
                {isCollapsed ? `Colors (${temporaryColors.length})` : "Colors"}
              </Text>
            )}
            {currentSubscreen !== "posts" && (
              <Text className="text-[#333333] font-JakartaBold text-[16px]">Posts</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={async () => {
          const tab = "Friends"
          if (user!.id == userId) {
            router.push({
              pathname: "/root/chat",
              params: {tab}
            });
          }
          if(user!.id != userId && friendStatus.name == "unknown" || friendStatus.name == "none") {
            handleSendFriendRequest()
          }
          if(user!.id != userId && friendStatus.name == "received") {
            setIsHandlingFriendRequest(true);
            const response = await acceptFriendRequest(
              profileUser!.clerk_id,
              user!.id
            );
            if (response === FriendStatus.FRIENDS) {
              Alert.alert("Friend request accepted!");
            } else {
              Alert.alert("Error accepting friend request.");
            }
            setFriendStatus(response);
            setIsHandlingFriendRequest(false);
          }
          if(user!.id != userId && friendStatus.name == "sent") {
              setIsHandlingFriendRequest(true);
              const response: FriendStatusType = await cancelFriendRequest(
              user!.id,
              userId
            );
            if (response === FriendStatus.NONE) {
              Alert.alert("Friend request cancelled.");
            } else {
              Alert.alert("Error cancelling friend request.");
            }
            setFriendStatus(response);
            setIsHandlingFriendRequest(false);
          }
          if(user!.id != userId && friendStatus.name == "friends") {
            setIsHandlingFriendRequest(true);
            const response: FriendStatusType = await unfriend(user!.id, userId);
            if (response === FriendStatus.NONE) {
              Alert.alert("You have unfriended this user.");
            } else {
              Alert.alert("Error unfriending this user.");
            }
            setFriendStatus(response);
            setIsHandlingFriendRequest(false);
          }
        }} className="flex-1 max-w-[135px] p-5  items-center justify-between" 
        style={{backgroundColor: user!.id == userId ? "#93c5fd" :  friendStatus.name != "unknown" ? "#FF6B6B" : "#000", 
        height: isCollapsed ? 60 : 150, 
        borderRadius: isCollapsed ? 24 : 32 }}>
              { !isCollapsed &&<View  className="w-full flex flex-row items-start">
              {user!.id == userId && <View>
                <Text className="text-white font-JakartaBold text-3xl">{friendCount}</Text>
              </View>}
              {user!.id !== userId && <View>
                <Text className="text-white font-JakartaBold text-4xl">+</Text>
              </View>}
              </View>}

              { !isCollapsed &&<View>
              <FontAwesome5 name="user-friends" size={30} color="white" marginTop={-20}/>
              </View>}
              {user!.id == userId && <View>
                <Text className="text-white font-JakartaBold text-[16px]">Friends</Text>
              </View>}
              {user!.id !== userId && friendStatus.name == "unknown" && <View>
                <Text className="text-white font-JakartaBold text-[16px]">Add Friend</Text>
              </View>}
              {user!.id !== userId && friendStatus.name != "friends" && friendStatus.name == "none" && <View>
                <Text className="text-white font-JakartaBold text-[16px]">Add friend</Text>
              </View>}
              {user!.id !== userId && friendStatus.name != "friends" && friendStatus.name == "sent" && <View>
                <Text className="text-white font-JakartaBold text-[12px]">Cancel request</Text>
              </View>}
              {user!.id !== userId && friendStatus.name != "friends" && friendStatus.name == "received" && <View>
                <Text className="text-white font-JakartaBold text-[12px]">Accept request</Text>
              </View>}
              {user!.id !== userId && friendStatus.name == "friends" && <View>
                <Text className="text-white font-JakartaBold text-[16px]">Unfriend</Text>
              </View>}
        </TouchableOpacity>

     

      <TouchableOpacity 

        onPress={() => {
          const isViewingOwnProfile = user!.id === profileUser!.clerk_id;
          // Always go to personal board, whether it's your own or someone else's
          router.push({
            pathname: "/root/personal-board",
            params: { id: isViewingOwnProfile ? user!.id : profileUser!.clerk_id }
          });
        }}
                  
        className="flex-1 max-w-[135px] p-5 bg-gray-200 items-center justify-between"
        style={{
          height: isCollapsed ? 60 : 150, 
          borderRadius: isCollapsed ? 24 : 32
        }}
        
      >

        {!isCollapsed && (
          <View className="w-full flex flex-row items-start">
            <Text className="text-[#333333] font-JakartaBold text-3xl">
              
              {user!.id === profileUser!.clerk_id ? "My" : "Leave"}
            </Text>
          </View>
        )}
        <Image
          source={icons.chat}
          tintColor="#333333"
          resizeMode="contain"
          className="w-10 h-10 -mt-4"
        />
        <Text className="text-[#333333] font-JakartaBold text-[16px]">
          {isCollapsed ? "Personal" : user!.id === profileUser!.clerk_id  ? "Personal Board" : "Note"}
        </Text>
      </TouchableOpacity>


      
      </View>

      <View className="mx-7 mt-5">
      </View>
               </View>}
      <View className="items-center flex-1 mt-5">
        {currentSubscreen === "colors" ? (
          <View className="items-center">
            <ColorGallery />
          </View>
        ) : currentSubscreen === "posts" ? (
          <View className="items-center flex-1 w-full">
          <TextInput
          className="w-4/5  h-12 px-5 rounded-[16px] bg-gray-200 mb-5 "
          placeholder="Search"
          onChangeText={setQuery}
          value={query}
          />
          <View className="items-center flex-1">
            <PostGallery
              posts={userPosts}
              profileUserId={profileUser!.clerk_id}
              handleUpdate={fetchUserData}
              query={query}
            />
          </View>
          </View>
        ) : (
      
          <View className="items-center flex-1">
            <PostGallery
              posts={userPosts}
              profileUserId={profileUser!.clerk_id}
              handleUpdate={fetchUserData}
            />
          </View>
        )}
      </View>

    </View>
  );
};

export default UserProfile;

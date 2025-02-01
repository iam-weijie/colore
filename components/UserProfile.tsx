import { useNavigationContext } from "@/components/NavigationContext";
import PostGallery from "@/components/PostGallery";
import { icons } from "@/constants/index";
import { fetchAPI } from "@/lib/fetch";
import {
  Post,
  UserData,
  UserNicknamePair,
  UserProfileProps,
  UserProfileType,
} from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ColorGallery from "./ColorGallery";
import DropdownMenu from "./DropdownMenu";

const FriendStatus = Object.freeze({
  UNKNOWN: {name: "unknown"},
  NONE: {name: "none"},
  SENT: {name: "sent"},
  RECEIVED: {name: "received"},
  FRIENDS: {name: "friends"},
})

const UserProfile: React.FC<UserProfileProps> = ({ userId, onSignOut }) => {
  const { user } = useUser();
  const [nickname, setNickname] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<UserProfileType | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const { stateVars, setStateVars } = useNavigationContext();
  const router = useRouter();
  const [currentSubscreen, setCurrentSubscreen] = useState<string>("posts");
  const [convId, setConvId] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState(FriendStatus.UNKNOWN); // initialize to this state
  const [isSendingFriendRequest, setIsSendingFriendRequest] = useState(false);

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

  // if the user has received a friend request (aka FriendStatus.RECEIVED)
  const acceptFriendRequest = async () => {

  }

  // returns FriendStatus.FRIENDS if two users are friends, otherwise FriendStatus.NONE
  const fetchFriendship = async () => {
    try {
      const response = await fetchAPI(
        `/api/friends/getFriendForUser?user_id=${user!.id}&friend_id=${userId}`,
        {
          method: "GET",
        }
      );
      if (response.error) {
        throw new Error(response.error);
      }
      if (response.data.length > 0) {
        return FriendStatus.FRIENDS;
      }
      return FriendStatus.NONE;
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      return FriendStatus.UNKNOWN;
    }
  };

  // returns FriendStatus.SENT if friend request sent, otherwise FriendStatus.RECEIVED if received, otherwise FriendStatus.NONE
  const fetchFriendRequestStatus = async () => {
    try {
      const response = await fetchAPI(
        `/api/friends/getFriendRequestsForUser?user_id=${user!.id}&request_id=${userId}`,
        {
          method: "GET",
        }
      );
      if (response.error) {
        throw new Error(response.error);
      }
      if (response.data.length > 0) {
        if (response.data[0].requestor === user!.id) {
          return FriendStatus.SENT;
        } else {
          return FriendStatus.RECEIVED;
        }
      }
      return FriendStatus.NONE;
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      return FriendStatus.UNKNOWN;
    }
  };

  const fetchFriendStatus = async () => {
    if (user!.id === userId) {
      return FriendStatus.UNKNOWN;
    }
    let friendStatus = await fetchFriendship();
    if (friendStatus !== FriendStatus.FRIENDS) 
      friendStatus = await fetchFriendRequestStatus();
    return friendStatus;
  }

  useEffect(() => {
    const getData = async () => {
      const data = await fetchCurrentNickname();
      setNickname(data);
    };
    getData();
  }, [stateVars]);

  useEffect(() => {
    const getFriendStatus = async () => {
      let status = await fetchFriendStatus();
      if (status == FriendStatus.NONE) {
        status = await fetchFriendRequestStatus();
      }
      console.log("Friend status:", friendStatus.name);
      setFriendStatus(status);
    };
    getFriendStatus();
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
      setIsSendingFriendRequest(true);
      await fetchAPI(`/api/friends/newFriendRequest`, {
        method: "POST",
        body: JSON.stringify({
          clerkId: user!.id,
          friendId: userId,
        }),
      });
      Alert.alert("Friend request sent!");
      setFriendStatus(FriendStatus.SENT);
      setIsSendingFriendRequest(false);

    } catch (error) { 
      console.error("Failed to send friend request:", error);
      Alert.alert("Error sending friend request.");
    }
  }

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
    }
  ]

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
      }
    }
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
      onPress: () => {
        // send request to unfriend, TBA
      }
    }
  ]

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
      label: "Your friend request is pending",
      onPress: () => {
        // doesn't do anything, ability to cancel friend request TBA
      }
    }
  ]

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
      onPress: () => {
        acceptFriendRequest();
      }
    }
  ]

  return (
    <View className="flex-1 mt-3">
      <View className="mx-7 mb-2">
        {!isEditable && (
          <View className="flex flex-row items-center justify-between pb-3">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <AntDesign name="caretleft" size={18} />
            </TouchableOpacity>
            <View className="flex flex-row items-right">
              {friendStatus === FriendStatus.FRIENDS && (
                <DropdownMenu menuItems={menuItems_friend} customMenuWidth={150}/>
              )
              }
              {
                friendStatus === FriendStatus.SENT && (
                  <DropdownMenu menuItems={menuItems_sent} customMenuWidth={150}/>
                )
              }
              {
                friendStatus === FriendStatus.RECEIVED && (
                  <DropdownMenu menuItems={menuItems_received} customMenuWidth={150}/>
                )
              }
              {
                friendStatus === FriendStatus.NONE && (
                  <DropdownMenu menuItems={menuItems_default} customMenuWidth={150}/>
                )
              }
              {
                friendStatus === FriendStatus.UNKNOWN && (
                  <DropdownMenu menuItems={menuItems_unloaded} customMenuWidth={150}/>
                )
              }
            </View>
          </View>
        )}
        <View className="flex flex-row items-center justify-between">
          <Text className={`text-2xl font-JakartaBold flex-1`}>
            {nickname
              ? nickname
              : profileUser?.username
                ? `${profileUser?.username}`
                : `${profileUser?.firstname?.charAt(0)}.`}
          </Text>
          <View className="flex flex-row items-right">
            {isEditable && (
              <TouchableOpacity onPress={() => router.push("/root/settings")}>
                <Image source={icons.settings} className="w-8 h-8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View>
        <Text className="text-gray-500 font-Jakarta text-base mt-3">
          📍{profileUser?.city}, {profileUser?.state}, {profileUser?.country}
        </Text>

        </View>
      </View>
      <View />
      <View className="mx-4 my-4">
        <View className="border-t border-gray-200" />
      </View>
      <View className="flex-row justify-between mx-6">
        <View className="flex-1 items-center">
          <Text className="text-gray-500 font-Jakarta">Colors</Text>
          <Text className="text-lg font-JakartaBold">3</Text>
        </View>

        <View className="flex-1 items-center">
          <Text className="text-gray-500 font-Jakarta">Friends</Text>
          <Text className="text-lg font-JakartaBold">0</Text>
        </View>

        <View className="flex-1 items-center">
          <Text className="text-gray-500 font-Jakarta">Posts</Text>
          <Text className="text-lg font-JakartaBold">{userPosts.length}</Text>
        </View>
      </View>
      <View className="mx-4 my-4">
        <View className="border-t border-gray-200" />
      </View>

      <View
        className="flex flex-row justify-around bg-transparent rounded-full p-2"
        style={{ width: "60%", alignSelf: "center" }}
      >
        <TouchableOpacity
          onPress={() => setCurrentSubscreen("posts")}
          className={`py-2.5 px-4 rounded-full ${
            currentSubscreen === "posts" ? "bg-gray-300" : ""
          }`}
        >
          <Image
            source={icons.home}
            tintColor={currentSubscreen === "posts" ? "#ffe640" : "#e0e0e0"}
            resizeMode="contain"
            className="w-6 h-6"
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setCurrentSubscreen("colors")}
          className={`p-2 rounded-full ${
            currentSubscreen === "colors" ? "bg-gray-300" : ""
          }`}
        >
          <Image
            source={icons.palette}
            tintColor={currentSubscreen === "colors" ? "#93c5fd" : "#e0e0e0"}
            resizeMode="contain"
            className="w-6 h-6 pt-1"
          />
        </TouchableOpacity>
      </View>

      <View className="mx-4 my-4">
        <View className="border-t border-gray-200" />
      </View>

      <View className="items-center flex-1">
        {currentSubscreen === "colors" ? (
          <View className="items-center">
            <ColorGallery />
          </View>
        ) : currentSubscreen === "posts" ? (
          <View className="items-center flex-1">
            <PostGallery
              posts={userPosts}
              profileUserId={profileUser!.clerk_id}
              handleUpdate={fetchUserData}
            />
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

      <View className="min-h-[80px]" />
    </View>
  );
};

export default UserProfile;

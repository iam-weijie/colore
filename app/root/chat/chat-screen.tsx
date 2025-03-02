import DropdownMenu from "@/components/DropdownMenu";
import NotificationBubble from "@/components/NotificationBubble";
import { FriendStatus } from "@/lib/enum";
import { fetchAPI } from "@/lib/fetch";
import { convertToLocal, formatDateTruncatedMonth } from "@/lib/utils";
import {
  acceptFriendRequest,
  fetchFriends,
  rejectFriendRequest,
  unfriend,
} from "@/lib/friend";
import {
  ConversationItem,
  FriendRequest,
  Friendship,
  FriendStatusType,
  RawFriendRequest,
  UserNicknamePair,
} from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";

import { icons } from "@/constants/index";
import { AntDesign } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
//import { ScrollView } from "react-native-gesture-handler";

const screenHeight = Dimensions.get("window").height;

declare interface ChatScreenProps {}
declare interface FriendRequestList {
  sent: FriendRequest[];
  received: FriendRequest[];
}

type TabNavigationProps = {
  name: string;
  focused: boolean;
  onPress: () => void;
  notifications: number;
};


const TabNavigation: React.FC<TabNavigationProps> = ({
  name,
  focused,
  onPress,
  notifications,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={() => {
        console.log(`Pressed tab: ${name}`);
        onPress();
      }}
    >
      <View
        className="min-w-[132px] h-[48px] rounded-[24px] mx-2 px-5 flex justify-center items-center"
        style={{
          backgroundColor: focused ? "#000000" : "#FBFBFB",
          overflow: "visible", // Ensure content is not clipped
        }}
      >
        <Text
          className="text-sm font-[600]"
          style={{ color: !focused ? "#000000" : "#FBFBFB" }}
        >
          {name} {notifications ? `(${notifications})` : null}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const ChatScreen: React.FC<ChatScreenProps> = () => {
  const { user } = useUser();

  // User experience
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>("");

  // Messages constants
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [skeletalConversationList, setSkeletalConversationList] = useState<ConversationItem[]>([]);
  const [toRead, setToRead] = useState<[]>([]);

  // Friend List & Request constants
  const [friendList, setFriendList] = useState<Friendship[]>([]);
  const [allFriendRequests, setAllFriendRequests] =
    useState<FriendRequestList>();
  const [nicknames, setNicknames] = useState<Record<string, string>>();
  const [handlingFriendRequest, setHandlingFriendRequest] =
    useState<boolean>(false);

  // Loading handlig
  const skeletalConversation = (id: string) => {
    return (
      {
    id: id,
    name: "",
    clerk_id: "",
    lastMessageContent: "",
    lastMessageTimestamp: new Date(),
    active_participants: 0,
    unread_messages: 0,
      }
    )
  }

  //Navigation
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  console.log("tab", tab);
  const [selectedTab, setSelectedTab] = useState<string>(
    tab ? tab : "Messages"
  );

  const fetchConversations = async (): Promise<void> => {
    setLoading(true);
    setSkeletalConversationList([
      skeletalConversation("1"), 
      skeletalConversation("2"), 
      skeletalConversation("3"), 
      skeletalConversation("4"),
      skeletalConversation("5"),
      skeletalConversation("6")])
    try {
      const responseConversation = await fetchAPI(
        `/api/chat/getConversations?id=${user!.id}`,
        {
          method: "GET",
        }
      );

      const responseNotifications = await fetch(
        `/api/notifications/getMessages?id=${user!.id}`
      );
      if (!responseNotifications) {
        throw new Error("Response is undefined.");
      }
      const responseData = await responseNotifications.json();

      const chatNotifications = responseData.toRead; // Notifications data
      const fetchedConversations = responseConversation.data; // Conversations data

      // Merge conversations with unread count from chatNotifications
      const conversationsWithUnread = fetchedConversations.map(
        (conversation: any) => {
          const matchingNotification = chatNotifications.filter(
            (notif: any) => notif.conversationid == conversation.id
          );
          // console.log("matching notification", matchingNotification);
          return {
            ...conversation, // Spread existing conversation data
            unread_messages: matchingNotification
              ? matchingNotification.length
              : 0, // Add unread_count
          };
        }
      );

      setToRead(chatNotifications);
      // console.log("chat notification", chatNotifications);
      setConversations(conversationsWithUnread);
      // console.log("conversation", conversationsWithUnread);
    } catch (error) {
      console.error("Failed to fetch conversations: ", error);
      setError("Failed to fetch conversations.");
    } finally {
      setLoading(false);
    }
  };

  const fetchNicknames = async () => {
    try {
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`, {
        method: "GET",
      });

      // Ensure response data exists and contains nicknames
      const nicknames: UserNicknamePair[] = response.data?.[0]?.nicknames || [];
      const nicknameMap: Record<string, string> =
        convertNicknameDictionary(nicknames);

      setNicknames(nicknameMap);
    } catch (error) {
      console.error("Failed to fetch nicknames: ", error);
      setError("Failed to fetch nicknames.");
    }
  };

  const convertNicknameDictionary = (userNicknameArray: UserNicknamePair[]) => {
    const map = Object.fromEntries(userNicknameArray.map((e) => [e[0], e[1]]));
    return map;
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await fetchAPI(
        `/api/friends/getFriendRequests?userId=${user!.id}`,
        {
          method: "GET",
        }
      );
      console.log("Friend Request", response.data);
      const processedFriendRequests: FriendRequest[] = processFriendRequests(
        response.data
      );
      const sentFriendRequests = processedFriendRequests.filter(
        (friendRequest) => friendRequest.senderId === user!.id
      );
      const receivedFriendRequests = processedFriendRequests.filter(
        (friendRequest) => friendRequest.receiverId === user!.id
      );
      const allFriendRequests = {
        sent: sentFriendRequests,
        received: receivedFriendRequests,
      };
      setAllFriendRequests(allFriendRequests);
    } catch (error) {
      console.error("Failed to fetch friend requests: ", error);
      setError("Failed to fetch friend requests.");
    }
  };

  const fetchFriendList = async () => {
    const data = await fetchFriends(user!.id);
    setFriendList(data);
  };

  const fetchFriendData = async () => {
    setLoading(true);
    await fetchFriendList();
    await fetchFriendRequests();
    await fetchNicknames();
    setLoading(false);
  };
  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(searchText.toLowerCase())
  );
  const filteredFriendList = friendList.filter((friend) =>
    friend.friend_username.toLowerCase().includes(searchText.toLowerCase())
  );

  const FriendLocation = ({ friendId }: { friendId: string }) => {
    const [location, setLocation] = useState<string>("Loading...");

    useEffect(() => {
      const fetchUserLocation = async (userId: string) => {
        try {
          const response = await fetchAPI(
            `/api/users/getUserInfo?id=${userId}`,
            {
              method: "GET",
            }
          );
          const country = response.data?.[0]?.country || "Unknown Country";
          const state = response.data?.[0]?.state || "Unknown State";
          const city = response.data?.[0]?.city || "Unknown City";

          setLocation(`${city}, ${state}, ${country}`);
        } catch (error) {
          console.error(error, "Couldn't find location");
          setLocation("Location not available");
        }
      };

      if (friendId) {
        fetchUserLocation(friendId);
      }
    }, [friendId]);

    return <Text className="text-gray-500 text-[12px]">{location}</Text>;
  };

  const handleUnfriending = async (friendId: string) => {
    Alert.alert(
      "Unfriend", // Title
      "Are you sure you want to unfriend this person?", // Message
      [
        {
          text: "Cancel",
          onPress: () => console.log("Unfriending Cancelled"),
          style: "cancel", // Makes the Cancel button stand out
        },
        {
          text: "Unfriend",
          onPress: async () => {
            try {
              setHandlingFriendRequest(true);
              const response: FriendStatusType = await unfriend(
                user!.id,
                friendId
              );
              if (response === FriendStatus.NONE) {
                Alert.alert("You have unfriended this user.");
              } else {
                Alert.alert("Error unfriending this user.");
              }
              fetchFriendData();
              setHandlingFriendRequest(false);
            } catch (error) {
              console.error("Couldn't unfriend that person...", error);
            }
          }, // Replace with your API call
          style: "destructive", // Red color for emphasis
        },
      ],
      { cancelable: true } // Close alert by tapping outside
    );
  };

  // RENDER LISTS ------ START
  const renderConversationItem = ({
    item,
  }: {
    item: ConversationItem;
  }): React.ReactElement => (
    <TouchableOpacity onPress={() => handleOpenChat(item)}>
      <View className="flex items-center mb-2 p-4 rounded-[16px]" 
      style={{ backgroundColor: loading ? "#E5E7EB" : "#FAFAFA"}}
      >
        <View className="w-full">
          <View className="flex flex-row justify-between items-center">
            <Text className="text-[16px] font-bold mb-1">{item.name}</Text>
            <Text className="text-[12px] text-gray-400">
              {item.lastMessageTimestamp && !loading
                ? new Date(item.lastMessageTimestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  })
                : ""}
            </Text>
          </View>
          {item.lastMessageContent ? (
            <View className="flex flex-row items-start justify-between -mt-1">
              <Text
                className="text-[14px]"
                style={{ fontWeight: item.unread_messages ? 600 : 400 }}
              >
                {item.lastMessageContent}
              </Text>
              {item.unread_messages > 0 && (
                <NotificationBubble
                  unread={item.unread_messages}
                  color={"#000000"}
                />
              )}
            </View>
          ) : (
            <Text className="text-gray-600 text-sm -mt-1 ">
              {loading ? "" : "No messages yet"}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFriend = ({ item }: { item: Friendship }) => (
    <View className="flex  mb-2 p-4 rounded-[16px]"
    style={{ backgroundColor: loading ? "#E5E7EB" : "#FAFAFA"}}
    >
      <View className="flex flex-row justify-between items-center mx-2">
        <View>
          <TouchableOpacity
            className="flex-1"
            activeOpacity={0.6}
            onPress={() => handleUserProfile(item.friend_id)}
            onLongPress={async () => handleUnfriending(item.friend_id)}
          >
            <View>
              <Text className="text-[16px] font-bold ">
                {nicknames && item.friend_id in nicknames
                  ? nicknames[item.friend_id]
                  : item.friend_username}
              </Text>
              <FriendLocation friendId={item.friend_id} />
            </View>
          </TouchableOpacity>
        </View>
        <View className="flex flex-row items-center justify-center">
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: "/root/user-board/[id]",
                params: { id: item.friend_id, username: item.friend_username },
              });
            }}
          >
            <Image
              source={icons.album}
              tintColor="#000000"
              resizeMode="contain"
              className="w-8 h-8"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderIncomingRequest = ({ item }: { item: FriendRequest }) => (
    <View  className=" py-6 border-b border-gray-200">
      <View className="flex-row justify-between items-center">
        <TouchableOpacity onPress={() => handleUserProfile(item.senderId)}>
          <Text className="font-JakartaSemiBold">
            {nicknames && item.senderId in nicknames
              ? nicknames[item.senderId]
              : item.senderUsername}
          </Text>
        </TouchableOpacity>
        <DropdownMenu
          menuItems={[
            {
              label: "Accept",
              source: icons.check,
              color: "#08DA14",
              onPress: async () => {
                setHandlingFriendRequest(true);
                const returnStats = await acceptFriendRequest(
                  item.senderId,
                  item.receiverId
                );
                if (returnStats === FriendStatus.FRIENDS) {
                  alert("Friend request accepted!");
                } else {
                  alert("Error when trying to accept friend request.");
                }
                fetchFriendRequests();
                fetchFriendList();
                setHandlingFriendRequest(false);
              },
            },
            {
              label: "Reject",
              source: icons.close,
              color: "#DA0808", 
              onPress: async () => {
                setHandlingFriendRequest(true);
                const returnStats = await rejectFriendRequest(
                  item.senderId,
                  item.receiverId
                );
                if (returnStats === FriendStatus.NONE) {
                  alert("Friend request rejected!");
                } else {
                  alert("Error when trying to reject friend request.");
                }
                fetchFriendRequests();
                setHandlingFriendRequest(false);
              },
            },
          ]}
        />
      </View>
    </View>
  );

  const renderOutgoingRequest = ({ item }: { item: FriendRequest }) => (
    <View className=" py-6 border-b border-gray-200">
      <View >
        <TouchableOpacity className="flex-column justify-center items-start " onPress={() => handleUserProfile(item.receiverId)}>
          <Text className="font-JakartaSemiBold">
            {nicknames && item.receiverId in nicknames
              ? nicknames[item.receiverId]
              : item.receiverUsername}
          </Text>
          <Text className="text-gray-500 italic text-xs">Since {typeof item.createdAt === "string"
                    ? formatDateTruncatedMonth(
                        convertToLocal(new Date(item.createdAt))
                      )
                    : "No date"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // RENDER LIST ------ END

  // HANDLE REQUESTS ------ START
  const processFriendRequests = (friendRequestData: RawFriendRequest[]) => {
    const friendRequests = friendRequestData.map((friendRequest) => {
      const isRequestorUID1 = friendRequest.requestor === "UID1";
      return {
        id: friendRequest.id,
        senderId: isRequestorUID1
          ? friendRequest.user_id1
          : friendRequest.user_id2,
        receiverId: isRequestorUID1
          ? friendRequest.user_id2
          : friendRequest.user_id1,
        createdAt: friendRequest.createdAt || friendRequest.created_at,
        senderUsername: isRequestorUID1
          ? friendRequest.user1_username
          : friendRequest.user2_username,
        receiverUsername: isRequestorUID1
          ? friendRequest.user2_username
          : friendRequest.user1_username,
      } as FriendRequest;
    });
    return friendRequests;
  };

  const handleOpenChat = (conversation: ConversationItem): void => {
    router.push(
      `/root/chat/conversation?conversationId=${conversation.id}&otherClerkId=${conversation.clerk_id}&otherName=${conversation.name}`
    );
  };

  const handleUserProfile = async (id: string) => {
    router.push({
      pathname: "/root/profile/[id]",
      params: { id },
    });
  };

  const handleCreateNewConversation = (): void => {
    router.push("/root/chat/new-conversation");
  };

  // console.log("All Friend Request", allFriendRequests?.sent);
  // HANDLE REQUESTS ------ END

  // USE EFFECT ------- START

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
      fetchFriendData();
    }, [])
  );

  // console.log(conversations);
  console.log("allFriendRequests", allFriendRequests?.sent);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-gray-100">
        
          <View className="flex-1">
            <View className="flex flex-row justify-between items-center mx-4 mb-4 mt-4">
              <View className="flex flex-row items-center mr-2">
                <TouchableOpacity onPress={() => router.back()}>
                  <AntDesign name="caretleft" size={18} color="0076e3" />
                </TouchableOpacity>
                <Text className="font-JakartaBold text-2xl ml-2">
                  {selectedTab}
                </Text>
              </View>

              <View className="flex flex-row items-center mx-4">
                <TouchableOpacity
                  onPress={handleCreateNewConversation}
                  className="w-8 h-8 ml-2 flex justify-center items-center bg-black rounded-full"
                >
                  <View className="flex justify-center items-center w-full h-full">
                    <Text className="text-white text-2xl -mt-[3px]">+</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={{ flexGrow: 0 }}
              contentOffset={{ x: 10, y: 0 }}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              className="max-h-[50px]"
            >
              <View className="flex flex-row items-center justify-between mx-6">
                <TabNavigation
                  name="Messages"
                  focused={selectedTab === "Messages"}
                  onPress={() => {
                    setSelectedTab("Messages");
                    setSearchText("");
                  }}
                  notifications={toRead.length}
                />
                <TabNavigation
                  name="Friends"
                  focused={selectedTab === "Friends"}
                  onPress={() => {
                    setSelectedTab("Friends");
                    setSearchText("");
                  }}
                  notifications={friendList.length}
                />
                <TabNavigation
                  name="Requests"
                  focused={selectedTab === "Requests"}
                  onPress={() => setSelectedTab("Requests")}
                  notifications={
                    allFriendRequests
                      ? allFriendRequests.sent.length +
                        allFriendRequests.received.length
                      : 0
                  }
                />
              </View>
            </ScrollView>

            {selectedTab === "Messages" && (
              <FlatList
                className="rounded-[16px] mx-4"
                ListHeaderComponent={
                  <View className="flex flex-row items-center mb-4 mt-4">
                    <TextInput
                      className="w-full h-12 px-5 -pt-1 rounded-[16px] bg-gray-200 text-base focus:outline-none focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Search conversations..."
                      value={searchText}
                      onChangeText={(text): void => setSearchText(text)}
                    />
                  </View>
                }
                data={loading ? skeletalConversationList : filteredConversations}
                renderItem={renderConversationItem}
                keyExtractor={(item): string => item.id}
              />
            )}

            {selectedTab == "Friends" && (
              <FlatList
                className="rounded-[16px] mx-4"
                ListHeaderComponent={
                  <View className="flex flex-row items-center mb-4 mt-4">
                    <TextInput
                      className="w-full h-12 px-5 -pt-1 rounded-[16px] bg-gray-200 text-base focus:outline-none focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Search friend..."
                      value={searchText}
                      onChangeText={(text): void => setSearchText(text)}
                    />
                  </View>
                }
                data={filteredFriendList}
                renderItem={renderFriend}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                  <Text className="text-center text-gray-500">No friends</Text>
                }
              />
            )}
            {selectedTab == "Requests" && (
              <View className="flex-1 mt-3 mx-4">
                {/* Container for both lists, flex-1 to take all available space */}
                <View className="flex-1 flex-col">
                  {/* Top half: Incoming Requests */}
                  <View className="mb-2">
                    <FlatList
                      className=" p-4 bg-[#FAFAFA] rounded-[24px]"
                      data={allFriendRequests?.received}
                      ListHeaderComponent={
                        <View>
                          <Text className="font-JakartaBold text-lg">
                            Requests{" "}
                          </Text>
                          <NotificationBubble
                            unread={
                              allFriendRequests?.received
                                ? allFriendRequests.received.length
                                : 0
                            }
                            color="#ffd12b"
                          />
                        </View>
                      }
                      renderItem={renderIncomingRequest}
                      keyExtractor={(item) => item.id.toString()}
                      ListEmptyComponent={
                        <Text className="text-left text-gray-500">
                          No friend requests
                        </Text>
                      }
                      showsVerticalScrollIndicator={false}
                      scrollEnabled={allFriendRequests?.received.length > 0}
                    />
                  </View>

                  {/* Bottom half: Outgoing Requests */}
                  <View className="flex-1 mt-2">
                    <FlatList
                      className=" p-4 bg-[#FAFAFA] rounded-[24px]"
                      data={allFriendRequests?.sent}
                      ListHeaderComponent={
                        <View>
                          <Text className="font-JakartaBold text-lg">
                            Sent{" "}
                          </Text>
                          <NotificationBubble
                            unread={
                              allFriendRequests?.sent
                                ? allFriendRequests.sent.length
                                : 0
                            }
                            color="#ffd12b"
                          />
                        </View>
                      }
                      renderItem={renderOutgoingRequest}
                      keyExtractor={(item) => item.id.toString()}
                      ListEmptyComponent={
                        <Text className="text-left text-gray-500">
                          No outgoing friend requests
                        </Text>
                      }
                      showsVerticalScrollIndicator={false}
                      scrollEnabled={allFriendRequests?.sent.length > 0}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
      
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;

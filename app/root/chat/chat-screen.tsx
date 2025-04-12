import DropdownMenu from "@/components/DropdownMenu";
import NotificationBubble from "@/components/NotificationBubble";
import { FriendStatus } from "@/lib/enum";
import { fetchAPI } from "@/lib/fetch";
import {
  acceptFriendRequest,
  fetchFriends,
  rejectFriendRequest,
  cancelFriendRequest,
  unfriend,
} from "@/lib/friend";
import { convertToLocal, formatDateTruncatedMonth, getRelativeTime } from "@/lib/utils";
import {
  ConversationItem,
  FriendRequest,
  Friendship,
  FriendStatusType,
  RawFriendRequest,
  UserNicknamePair,
  Post,
  PostComment
} from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState, useRef } from "react";

import { icons } from "@/constants/index";
import { AntDesign } from "@expo/vector-icons";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Keyboard,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigationContext } from "@/components/NavigationContext";
import { useAlert } from '@/notifications/AlertContext';
import TabNavigation from "@/components/TabNavigation";
import { useGlobalContext } from "@/app/globalcontext";
import ItemContainer from "@/components/ItemContainer";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
//import { ScrollView } from "react-native-gesture-handler";

const screenHeight = Dimensions.get("window").height;

declare interface ChatScreenProps {}
declare interface FriendRequestList {
  sent: FriendRequest[];
  received: FriendRequest[];
}




export const ChatScreen: React.FC<ChatScreenProps> = () => {
  const { user } = useUser();
  const { showAlert } = useAlert();

  // User experience
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [users, setUsers] = useState<UserNicknamePair[]>([]);
  const [showDeleteIcon, setShowDeleteIcon] = useState<boolean>(false);
  const { stateVars, setStateVars } = useNavigationContext();

  // Messages constants
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [skeletalConversationList, setSkeletalConversationList] = useState<
    ConversationItem[]
  >([]);
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
    return {
      id: id,
      name: "",
      clerk_id: "",
      lastMessageContent: "",
      lastMessageTimestamp: new Date(),
      active_participants: 0,
      unread_messages: 0,
    };
  };

  //Navigation
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [selectedTab, setSelectedTab] = useState<string>(
    tab ? tab : "Friends"
  );

  const fetchConversations = async (): Promise<void> => {
    setLoading(true);
    setSkeletalConversationList([
      skeletalConversation("1"),
      skeletalConversation("2"),
      skeletalConversation("3"),
      skeletalConversation("4"),
      skeletalConversation("5"),
      skeletalConversation("6"),
    ]);
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

    const filteredUsers =
    searchText.length > 0
      ? users.filter(
          (user) =>
            user[1] && user[1].toLowerCase().includes(searchText.toLowerCase())
        )
      : [];

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
                showAlert({
                  title: 'Unfriended',
                  message: "You have unfriended this user.",
                  type: 'FRIEND_REQUEST',
                  status: 'success',
                });
              } else {
                showAlert({
                  title: 'Error',
                  message: `Error unfriending this user.`,
                  type: 'ERROR',
                  status: 'error',
                });
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
      <View
        className="flex items-center mb-2 p-4 rounded-[16px]"
        style={{ backgroundColor: loading ? "#E5E7EB" : "#FAFAFA" }}
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


 

  const FriendItem = ({ item, loading, setShowDeleteIcon }) => {

  
    return (
      <ItemContainer 
      label={nicknames && item.friend_id in nicknames
        ? nicknames[item.friend_id]
        : item.friend_username}
      caption={item.city !== item.state ? `${item.city}, ${item.state}, ${item.country}` : `${item.state}, ${item.country}`}
      colors={["#93c5fd", "#93c5fd"]}
      icon={icons.addUser}
      iconColor="#000"
      actionIcon={icons.chevron}
      onPress={() => {
        handleUserProfile(item.friend_id)
      }}
      />
    );
  };
  
  const renderFriend = ({ item }) => (
    <FriendItem item={item} loading={loading} setShowDeleteIcon={setShowDeleteIcon} />
  );
  

  const renderIncomingRequest = ({ item }: { item: FriendRequest }) => (
    <View 
    className="py-2 my-2">
      <View className="flex-row justify-between items-center">
        <TouchableOpacity onPress={() => handleUserProfile(item.senderId)}>
          <Text className="font-JakartaBold text-[14px]">
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
              color: "#93c5fd",
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
    <ItemContainer 
    label={nicknames && item.receiverId in nicknames
      ? nicknames[item.receiverId]
      : item.receiverUsername}
    caption={
          getRelativeTime(convertToLocal(new Date(item.createdAt)))
      }
    colors={["#CFB1FB", "#CFB1FB"]}
    icon={icons.send}
    actionIcon={icons.chevron}
    iconColor="#000"
    onPress={() => {
      handleUserProfile(item.receiverId)
    }}
    />

  );


       const renderUser = ({
          item,
        }: {
          item: UserNicknamePair;
        }): React.ReactElement => (
          <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: "/root/profile/[id]",
              params: { id: item[0] },
            });
          }}
            //disabled={creatingChat}
            className="p-4"
          >
            <View className="flex flex-row justify-between items-center">
              <Text className="text-[14px] font-JakartaBold text-black left-2">{item[1]}</Text>
            </View>
          </TouchableOpacity>
        );
    {
      /* <CustomButton
          title="Chat"
          onPress={() => startChat(item)}
          disabled={!item[1]}
          className="w-14 h-8 rounded-md"
          fontSize="sm"
          padding="0"
        /> */
    }
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
      setStateVars({ ...stateVars, queueRefresh: true});
    }, [])
  );


  useEffect(() => {
    fetchUsers();
  }, []);


  // console.log(conversations);
  // console.log("firends", friendList, "\n\nSent", allFriendRequests?.sent, "\n\nReceived", allFriendRequests?.received);

  return (
    <TouchableWithoutFeedback
    className="flex-1"
    onPress={() => Keyboard.dismiss()}
    onPressIn={() => Keyboard.dismiss()}>
      <View className="flex-1">

          
            <View className="w-full flex-row items-start justify-between ">

            <TabNavigation
                name="Find"
                focused={selectedTab === "Find"}
                onPress={() => {
                  setSelectedTab("Find");
                  setSearchText("");
                }}
                notifications={0}
              />
              <TabNavigation
                name="Friends"
                focused={selectedTab === "Friends"}
                onPress={() => {
                  setSelectedTab("Friends");
                  setSearchText("");
                }}
                notifications={0}
              />
              <TabNavigation
                name="Requests"
                focused={selectedTab === "Requests"}
                onPress={() => setSelectedTab("Requests")}
                notifications={
                  allFriendRequests
                    ? allFriendRequests.received.length
                    : 0
                }
              />
            </View>

          {selectedTab == "Find" && 
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
                                          
                                          data={filteredUsers}
                                          contentContainerStyle={{ 
                                            paddingBottom: 40, 
                                            minHeight: screenHeight * 0.4,
                                            maxHeight: screenHeight * 0.6
                                          }} 
                                          renderItem={renderUser}
                                          keyExtractor={(item): string => String(item[0])}
                                          showsVerticalScrollIndicator={false}
                                        />
                                      )}
            </View>}
          {selectedTab == "Friends" && (
            <View className="flex-1">
              <View className="flex flex-row items-center w-[90%] mx-auto ">
              <TextInput
                className="w-full h-12 px-3 -pt-1 rounded-[16px] bg-[#F1F1F1] text-[12px] focus:outline-none focus:border-blue-500 focus:ring-blue-500"
                placeholder="Search friend..."
                value={searchText}
                onChangeText={(text): void => setSearchText(text)}
              />
            </View>
            <FlatList
              className="rounded-[16px] mt-3"
              
            
              data={filteredFriendList}
              contentContainerStyle={{ 
                paddingBottom: 40,
              minHeight: screenHeight * 0.46 }} 
              renderItem={renderFriend}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <Text className="text-center text-gray-500">No friends</Text>
              }
              showsVerticalScrollIndicator={false}
            />
            </View>
          )}
          {selectedTab == "Requests" && (
            <View className="flex-1 mt-3 mx-4">
              {/* Container for both lists, flex-1 to take all available space */}
              <View className="flex-1 flex-col">
                {/* Top half: Incoming Requests */}
                <View className="mb-2">
                <View className="p-2">
                <View className="flex-row items-center justify-start">
                        <Text className="font-JakartaBold text-[16px]">Request </Text>
                        <View className="absolute top-[50%] right-3">
                        <NotificationBubble
                          unread={
                            allFriendRequests?.received
                              ? allFriendRequests.received.length
                              : 0
                          }
                          color="#CFB1FB"
                        />
                        </View>
                        </View>
                      </View>
                  <FlatList
                     className="px-2 rounded-[24px]"
                    data={allFriendRequests?.received}
                    contentContainerStyle={{ paddingBottom: 20 }} 
                    renderItem={renderIncomingRequest}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={
                      <Text className="text-left text-gray-500 py-2 text-[12px]">
                        No friend requests
                      </Text>
                    }
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={
                      allFriendRequests && allFriendRequests.received.length > 0
                    }
                  />
                </View>

                {/* Bottom half: Outgoing Requests */}
                <View className=" flex-col mt-2">
                <View className="p-2">
                  <View className="flex-row items-center justify-start">
                        <Text className="font-JakartaBold text-[16px]">Sent </Text>
                        <View className="absolute top-[50%] right-3">
                        <NotificationBubble
                          unread={
                            allFriendRequests?.sent
                              ? allFriendRequests.sent.length
                              : 0
                          }
                          color="#CFB1FB"
                        />
                        </View>
                        </View>
                      </View>
                  <FlatList
                    className="rounded-[24px] "
                    data={allFriendRequests?.sent}
                    contentContainerStyle={{ 
                      paddingBottom: 20 }} 
                    renderItem={renderOutgoingRequest}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={
                      <Text className="text-left text-gray-500 py-2 text-[12px]">
                        No outgoing friend requests
                      </Text>
                    }
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={
                      allFriendRequests && allFriendRequests?.sent.length > 0
                    }
                  />
                </View>
              </View>
            </View>
          )}
        </View>
        </TouchableWithoutFeedback>
  );
};

export const NotificationScreen: React.FC<ChatScreenProps> = () => {
  const { user } = useUser();
  const { showAlert } = useAlert();
  const { storedNotifications, unreadComments, unreadPersonalPosts } = useGlobalContext()

  // Notifications
  const [commentsNotif, setCommentsNotif] = useState<PostComment[]>();
  const [postsNotif, setPostsNotif] = useState<Post[]>();

  // User experience
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteIcon, setShowDeleteIcon] = useState<boolean>(false);


  //Navigation
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [selectedTab, setSelectedTab] = useState<string>(
    tab ? tab : "Posts"
  );

//console.log("stored notification", storedNotifications.length)
  const removeNotification = (id: string) => {}

  // RENDER LISTS ------ START

  const NotificationItem = ({ item, loading, setShowDeleteIcon }) => {

    // Find post info for comments
    let post;
  
    if (!item.recipient_user_id) {
     // 🔍 Find the post (notification) that contains the specific comment
  const post = storedNotifications.find(n =>
    n.comments?.some((comment) => comment.id === item.id)
  );

   // post = storedNotifications.find((n) => n.comments.includes(item))
    }
  
  
    return (
      <ItemContainer 
      label={`${item.commenter_username ?? item.username} has ${item.commenter_username ? 'has commented a post.' : 'sent you a post'}`}
      caption={`${item.comment_content ?? item.content ?? ""}`} 
      colors={["#93c5fd", "#93c5fd"]}
      icon={item.comment_content ? icons.comment : icons.pencil}
      actionIcon={icons.chevron}
      iconColor="#000"
      onPress={() => {
        if (item.recipient_user_id) {
          router.push({
            pathname: "/root/user-board/[id]",
            params: { id: `${user!.id}`, username: `Personal board`},
          });
        }
      }}
      />
      
      
    );
  };
  
  const renderNotif = ({ item }) => (
    <NotificationItem item={item} loading={loading} setShowDeleteIcon={setShowDeleteIcon} />
  );
  

  // RENDER LIST ------ END



  // USE EFFECT ------- START

  useEffect(() => {

    const commentsArray: PostComment[] = [];
    const postsArray: Post[] = [];
    
    storedNotifications.forEach((notif) => {
      if (notif.comments) {
        commentsArray.push(...notif.comments);
      }
    
      if (notif.recipient_user_id) {
        console.log("here")
        postsArray.push(notif);
      }
    });
    
    setCommentsNotif(commentsArray);
    setPostsNotif(postsArray);

  }, [storedNotifications])


  return (
      <View className="flex-1 max-h-[450px]">

          
            <View className="flex-row items-start justify-between mx-2">

            <TabNavigation
                name="Comments"
                focused={selectedTab === "Comments"}
                onPress={() => {
                  setSelectedTab("Comments");
                  //setSearchText("");
                }}
                notifications={commentsNotif?.length ?? 0}
              />
              <TabNavigation
                name="Posts"
                focused={selectedTab === "Posts"}
                onPress={() => setSelectedTab("Posts")}
                notifications={postsNotif?.length ?? 0}
              />
              <TabNavigation
                name="Likes"
                focused={selectedTab === "Likes"}
                onPress={() => {
                  setSelectedTab("Likes");
                  //setSearchText("");
                }}
                notifications={0}
              />
            </View>

            {selectedTab === "Comments" &&  
            <FlatList
              className="rounded-[16px]"
              data={commentsNotif}
              contentContainerStyle={{ 
                paddingBottom: 40,
              minHeight: screenHeight * 0.46 }} 
              renderItem={renderNotif}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <Text className="text-center text-gray-500">No new notification</Text>
              }
              showsVerticalScrollIndicator={false}
            />}
            {selectedTab === "Posts" &&  
            <FlatList
              className="rounded-[16px]"
              data={postsNotif}
              contentContainerStyle={{ 
                paddingBottom: 40,
                justifyContent: 'center',
              minHeight: screenHeight * 0.46 }} 
              renderItem={renderNotif}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <Text className="text-center text-gray-500">No new notification</Text>
              }
              showsVerticalScrollIndicator={false}
            />}
            {selectedTab === "Likes" &&  
            <FlatList
              className="rounded-[16px] "
              data={[]}
              contentContainerStyle={{ 
                paddingBottom: 40,
              minHeight: screenHeight * 0.46 }} 
              renderItem={renderNotif}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <Text className="text-center text-gray-500">No new notification</Text>
              }
              showsVerticalScrollIndicator={false}
            />}

        </View>
  );
};


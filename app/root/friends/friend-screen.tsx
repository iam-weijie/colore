import DropdownMenu from "@/components/DropdownMenu";
import { FriendStatus } from "@/lib/enum";
import { fetchAPI } from "@/lib/fetch";
import {
  acceptFriendRequest,
  fetchFriends,
  rejectFriendRequest,
} from "@/lib/friend";
import { FriendRequest, Friendship, RawFriendRequest, UserNicknamePair } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { AntDesign } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

declare interface FriendScreenProps {}

declare interface FriendRequestList {
  sent: FriendRequest[];
  received: FriendRequest[];
}

const FriendScreen: React.FC<FriendScreenProps> = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [allFriendRequests, setAllFriendRequests] =
    useState<FriendRequestList>();
  const [selectedTab, setSelectedTab] = useState<string>("friends");
  const [handlingFriendRequest, setHandlingFriendRequest] =
    useState<boolean>(false);
  const [friendList, setFriendList] = useState<Friendship[]>([]);
  const [nicknames, setNicknames] = useState<Record<string, string>>();

  const fetchNicknames = async () => {
    try {
      const response = await fetchAPI(
        `/api/users/getUserInfo?id=${user!.id}`,
        {
          method: "GET",
        }
      );
      const nicknames: UserNicknamePair[] = response.data[0].nicknames;
      const nicknameMap: Record<string, string> = convertNicknameDictionary(nicknames);
      setNicknames(nicknameMap);
    } catch (error) {
      console.error("Failed to fetch nicknames: ", error);
      setError("Failed to fetch nicknames.");
    }
  };

  const convertNicknameDictionary = (userNicknameArray: UserNicknamePair[] ) => {
    const map = Object.fromEntries(
      userNicknameArray.map(e => [e[0], e[1]])
    );
    return map;
  }

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
        createdAt: friendRequest.createdAt,
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

  const handleUserProfile = async (id: string) => {
    router.push({
      pathname: "/root/profile/[id]",
      params: { id },
    });
  };

  useFocusEffect(
    useCallback(() => {
      fetchFriendData();
    }, [])
  );

  const renderIncomingRequest = ({ item }: { item: FriendRequest }) => (
    <View className="p-4 border-b border-gray-200">
      <View className="flex-row justify-between items-center mx-4">
        <TouchableOpacity onPress={() => handleUserProfile(item.senderId)}>
          <Text className="font-JakartaSemiBold">
            {(nicknames && item.senderId in nicknames) 
            ? nicknames[item.senderId] :
            item.senderUsername}
          </Text>
        </TouchableOpacity>
        <DropdownMenu
          menuItems={[
            {
              label: "Accept",
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
    <View className="p-4 border-b border-gray-200">
      <View className="flex-row justify-between items-center mx-4">
        <TouchableOpacity onPress={() => handleUserProfile(item.receiverId)}>
          <Text className="font-JakartaSemiBold">
            {(nicknames && item.receiverId in nicknames) 
              ? nicknames[item.receiverId] : 
              item.receiverUsername}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFriend = ({ item }: { item: Friendship }) => (
    <View className="p-4 border-b border-gray-200">
      <View className="flex-row justify-between items-center mx-4">
        <TouchableOpacity onPress={() => handleUserProfile(item.friend_id)}>
          <Text className="font-JakartaSemiBold">
            {(nicknames && item.friend_id in nicknames) 
              ? nicknames[item.friend_id] :
              item.friend_username}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFriendsList = () => (
    <FlatList
      data={friendList}
      renderItem={renderFriend}
      keyExtractor={(item) => item.id.toString()}
      ListEmptyComponent={
        <Text className="text-center text-gray-500">No friends</Text>
      }
    />
  );

  const renderIncomingFriendRequests = () => (
    <FlatList
      data={allFriendRequests?.received}
      renderItem={renderIncomingRequest}
      keyExtractor={(item) => item.id.toString()}
      ListEmptyComponent={
        <Text className="text-center text-gray-500">No friend requests</Text>
      }
    />
  );

  const renderOutgoingFriendRequests = () => (
    <FlatList
      data={allFriendRequests?.sent}
      renderItem={renderOutgoingRequest}
      keyExtractor={(item) => item.id.toString()}
      ListEmptyComponent={
        <Text className="text-center text-gray-500">
          No outgoing friend requests
        </Text>
      }
    />
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-gray-100">
        {loading ? (
          <View className="flex-[0.8] justify-center items-center">
            <ActivityIndicator size="large" color="black" />
          </View>
        ) : (
          <View className="flex-1">
            <View className="flex-row justify-center items-center mx-4 mb-4 mt-4 relative">
              <TouchableOpacity
                onPress={() => router.back()}
                className="absolute left-0"
              >
                <AntDesign name="caretleft" size={18} color="0076e3" />
              </TouchableOpacity>
              <Text className="text-xl font-JakartaSemiBold">Friend list</Text>
            </View>
            <View className="flex-row justify-between mb-4 mx-8">
              <View className="max-w-[120px] flex-row justify-around">
                <TouchableOpacity onPress={() => setSelectedTab("friends")}>
                  <Text
                    className={`text-lg ${selectedTab === "friends" ? "font-bold" : ""}`}
                  >
                    Friends
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="max-w-[120px] flex-row justify-around">
                <TouchableOpacity onPress={() => setSelectedTab("incoming")}>
                  <Text
                    className={`text-lg ${selectedTab === "incoming" ? "font-bold" : ""}`}
                  >
                    Requests received
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="max-w-[120px] flex-row justify-around">
                <TouchableOpacity onPress={() => setSelectedTab("outgoing")}>
                  <Text
                    className={`text-lg ${selectedTab === "outgoing" ? "font-bold" : ""}`}
                  >
                    Requests sent
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {selectedTab === "incoming" && renderIncomingFriendRequests()}
            {selectedTab === "outgoing" && renderOutgoingFriendRequests()}
            {selectedTab === "friends" && renderFriendsList()}
          </View>
        )}
      </View>
      {error && <Text>An error occurred. </Text>}
    </SafeAreaView>
  );
};

export default FriendScreen;

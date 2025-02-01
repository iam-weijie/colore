import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { fetchAPI } from "@/lib/fetch";
import { AntDesign } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { RawFriendRequest, FriendRequest } from "@/types/type";
import { FriendStatus } from "@/lib/enum";
import { acceptFriendRequest } from "@/lib/friend";
import DropdownMenu from "@/components/DropdownMenu";
import CustomButton from "@/components/CustomButton";

declare interface FriendScreenProps {}

declare interface FriendRequestList {
  sent: FriendRequest[];
  received: FriendRequest[];
}

const FriendScreen: React.FC<FriendScreenProps> = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [allFriendRequests, setAllFriendRequests] = useState<FriendRequestList>();
  const [selectedTab, setSelectedTab] = useState<string>('friends');
  const [handlingFriendRequest, setHandlingFriendRequest] = useState<boolean>(false);

  const fetchFriendRequests = async () => {
    setLoading(true);
    try {
      const response = await fetchAPI(
        `/api/friends/getFriendRequests?userId=${user!.id}`,
        {
          method: "GET",
        }
      );
      const processedFriendRequests: FriendRequest[] = processFriendRequests(response.data);
      const sentFriendRequests = processedFriendRequests.filter((friendRequest) => friendRequest.senderId === user!.id);
      const receivedFriendRequests = processedFriendRequests.filter((friendRequest) => friendRequest.receiverId === user!.id);
      const allFriendRequests = {
        sent: sentFriendRequests,
        received: receivedFriendRequests,
      }
      setAllFriendRequests(allFriendRequests);
    } catch (error) {
      console.error("Failed to fetch friend requests: ", error);
      setError("Failed to fetch friend requests.");
    } finally {
      setLoading(false);
    }
  };

  const processFriendRequests = (friendRequestData: RawFriendRequest[]) => {
    const friendRequests = friendRequestData.map((friendRequest) => {
      const requestor = friendRequest.requestor === "UID1" ? friendRequest.user_id1 : friendRequest
      return {
        id: friendRequest.id,
        senderId: requestor,
        receiverId: requestor === friendRequest.user_id1 ? friendRequest.user_id2 : friendRequest.user_id1,
        createdAt: friendRequest.createdAt,
        senderUsername: requestor === friendRequest.user_id1 ? friendRequest.user1_username : friendRequest.user2_username,
        receiverUsername: requestor === friendRequest.user_id1 ? friendRequest.user2_username : friendRequest.user1_username,
      } as FriendRequest;
    });
    return friendRequests;
  }

  useEffect(() => {
    fetchFriendRequests();
  }, []);

  const renderIncomingRequest = ({ item }: { item: FriendRequest }) => (
    <View className="p-4 border-b border-gray-200">
      <View className="flex-row justify-between items-center mx-4">
        <Text className="font-JakartaSemiBold">{item.senderUsername}</Text>
          <DropdownMenu
            menuItems={[
              {
                label: "Accept",
                onPress: async () => {
                  setHandlingFriendRequest(true);
                  const returnStats = await acceptFriendRequest(item.senderId, item.receiverId);
                  if (returnStats === FriendStatus.FRIENDS) {
                    alert("Friend request accepted!");
                  } else {
                    alert("Error when trying to accept friend request.")
                  }
                  fetchFriendRequests();
                  setHandlingFriendRequest(false);
                }
              },
              {
                label: "Reject",
                onPress: async () => {
                  setHandlingFriendRequest(true);
                  const returnStats = await acceptFriendRequest(item.senderId, item.receiverId);
                  if (returnStats === FriendStatus.NONE) {
                    alert("Friend request rejected!");
                  } else {
                    alert("Error when trying to reject friend request.")
                  }
                  fetchFriendRequests();
                  setHandlingFriendRequest(false);
                }
              }
            ]}
          />
      </View>
    </View>
  );

  const renderOutgoingRequest = ({ item }: { item: FriendRequest }) => (
    <View className="p-4 border-b border-gray-200">
      <View className="flex-row justify-between items-center">
        <Text className="font-JakartaSemiBold">{item.receiverUsername}</Text>
      </View>
    </View>
  );

  const renderFriend = ({ item }: { item: FriendRequest }) => (
    <View>
      <Text>{item.senderUsername}</Text>
    </View>
  );

  const renderFriendsList = () => (
    <FlatList
      data={allFriendRequests?.received}
      renderItem={renderFriend}
      keyExtractor={(item) => item.id.toString()}
      ListEmptyComponent={<Text className="text-center text-gray-500">No friends</Text>}
    />
  );

  const renderIncomingFriendRequests = () => (
    <FlatList
      data={allFriendRequests?.received}
      renderItem={renderIncomingRequest}
      keyExtractor={(item) => item.id.toString()}
      ListEmptyComponent={<Text className="text-center text-gray-500">No friend requests</Text>}
    />
  );

  const renderOutgoingFriendRequests = () => (
    <FlatList
      data={allFriendRequests?.sent}
      renderItem={renderOutgoingRequest}
      keyExtractor={(item) => item.id.toString()}
      ListEmptyComponent={<Text className="text-center text-gray-500">No outgoing friend requests</Text>}
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
              <TouchableOpacity onPress={() => router.back()} className="absolute left-0">
                <AntDesign name="caretleft" size={18} color="0076e3" />
              </TouchableOpacity>
              <Text className="text-xl font-JakartaSemiBold">
                Friend list
              </Text>
            </View>
            <View className="flex-row justify-between mb-4 mx-8">
              <View className="max-w-[120px] flex-row justify-around">
                <TouchableOpacity onPress={() => setSelectedTab('friends')}>
                  <Text className={`text-lg ${selectedTab === 'friends' ? 'font-bold' : ''}`}>Friends</Text>
                </TouchableOpacity>
              </View>
              <View className="max-w-[120px] flex-row justify-around">
                <TouchableOpacity onPress={() => setSelectedTab('incoming')}>
                  <Text className={`text-lg ${selectedTab === 'incoming' ? 'font-bold' : ''}`}>Incoming requests</Text>
                </TouchableOpacity>
              </View>
              <View className="max-w-[120px] flex-row justify-around">
                <TouchableOpacity onPress={() => setSelectedTab('outgoing')}>
                  <Text className={`text-lg ${selectedTab === 'outgoing' ? 'font-bold' : ''}`}>Outgoing Requests</Text>
                </TouchableOpacity>
              </View>
            </View>
            {selectedTab === 'incoming' && renderIncomingFriendRequests()}
            {selectedTab === 'outgoing' && renderOutgoingFriendRequests()}
            {selectedTab === 'friends' && renderFriendsList()}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default FriendScreen;
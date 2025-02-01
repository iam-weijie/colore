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
import { formatDateTruncatedMonth, convertToLocal } from "@/lib/utils";

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
      } as FriendRequest;
    });
    return friendRequests;
  }

  useEffect(() => {
    fetchFriendRequests();
  }, []);

  const renderFriendRequest = ({ item }: { item: FriendRequest }) => (
    <View className="p-4 border-b border-gray-200">
      <Text className="font-JakartaSemiBold">{item.senderId}</Text>
    </View>
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
            <FlatList
              data={allFriendRequests?.received}
              renderItem={renderFriendRequest}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={<Text className="text-center text-gray-500">No friend requests</Text>}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default FriendScreen;
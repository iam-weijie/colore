import DropdownMenu from "@/components/DropdownMenu";
import NotificationBubble from "@/components/NotificationBubble";
import { FriendStatus } from "@/lib/enum";
import { fetchAPI } from "@/lib/fetch";
import { acceptFriendRequest, rejectFriendRequest } from "@/lib/friend";
import { convertToLocal, getRelativeTime } from "@/lib/utils";
import { FriendRequest, UserNicknamePair } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { icons } from "@/constants/index";
import { Ionicons } from "@expo/vector-icons";
import {
  Dimensions,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Keyboard,
} from "react-native";
import TabNavigation from "@/components/TabNavigation";
import ItemContainer from "@/components/ItemContainer";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import EmptyListView from "@/components/EmptyList";
import { useFriendsContext } from "@/app/contexts/FriendsContext";
import { FindUser } from "@/components/FindUsers";

const screenHeight = Dimensions.get("window").height;

// Reusable Components
const RequestSection = ({
    title,
    count,
    data,
    renderItem,
    emptyMessage,
    emptyCharacter,
    containerStyle = ""
  }) => {
    const hasData = data && data.length > 0;
    
    return (
      <View className={`${containerStyle}`}>
        <SectionHeader title={title} count={count} />
        
        {hasData ? (
          <FlatList
            className="px-2"
            data={data}
            contentContainerStyle={{
              paddingBottom: 80,
            }}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="items-center justify-center py-8">
            <Text className="text-sm text-gray-800">{emptyMessage}</Text>
          </View>
        )}
      </View>
    );
  };

const SectionHeader = ({ title, count }) => (
  <View className="p-2 flex-row items-center justify-start mx-4 relative">
    <Text className="font-JakartaSemiBold text-sm">
      {title} ({count})
    </Text>
    <View className="absolute top-1/2 right-3 -translate-y-1/2">
      <NotificationBubble unread={count} color="#CFB1FB" />
    </View>
  </View>
);

const IncomingRequestItem = ({ 
  request, 
  nicknames, 
  onAccept, 
  onReject, 
  onViewProfile, 
  disabled 
}) => {
  const displayName = nicknames && request.senderId in nicknames
    ? nicknames[request.senderId]
    : request.senderNickname || request.senderUsername;

  return (
    <View className="flex-row justify-between items-center">
      <ItemContainer
        label={displayName}
        caption={getRelativeTime(convertToLocal(new Date(request.createdAt)))}
        colors={["#CFB1FB", "#CFB1FB"]}
        icon={icons.send}
        iconColor="#000"
        onPress={() => {
          onViewProfile(request.senderId, displayName);
        }}
        disabled={disabled}
      />
      
      <View className="absolute right-3">
        <DropdownMenu
          menuItems={[
            {
              label: "Accept",
              source: icons.check,
              color: "#93c5fd",
              onPress: async () => {
                await onAccept(request.senderId, request.receiverId);
              },
            },
            {
              label: "Reject",
              source: icons.close,
              color: "#DA0808",
              onPress: async () => {
                await onReject(request.senderId, request.receiverId);
              },
            },
          ]}
          disabled={disabled}
        />
      </View>
    </View>
  );
};

const OutgoingRequestItem = ({ request, nicknames, onViewProfile }) => {
  const displayName = nicknames && request.receiverId in nicknames
    ? nicknames[request.receiverId]
    : request.receiverUsername;

  return (
    <ItemContainer
      label={displayName}
      caption={getRelativeTime(convertToLocal(new Date(request.createdAt)))}
      colors={["#CFB1FB", "#CFB1FB"]}
      icon={icons.send}
      actionIcon={icons.chevron}
      iconColor="#000"
      onPress={() => {
        onViewProfile(request.receiverId, displayName);
      }}
    />
  );
};

const FriendRequestsView = ({
  allFriendRequests,
  nicknames,
  onAcceptRequest,
  onRejectRequest,
  onViewProfile,
  handlingFriendRequest
}) => {
  const renderIncomingRequest = ({ item }) => (
    <IncomingRequestItem
      request={item}
      nicknames={nicknames}
      onAccept={onAcceptRequest}
      onReject={onRejectRequest}
      onViewProfile={onViewProfile}
      disabled={handlingFriendRequest}
    />
  );

  const renderOutgoingRequest = ({ item }) => (
    <OutgoingRequestItem
      request={item}
      nicknames={nicknames}
      onViewProfile={onViewProfile}
    />
  );

  return (
    <View className="flex-1 mt-3">
      <View className="flex-1 flex-col">
        <RequestSection
          title="Requests"
          count={allFriendRequests?.received?.length || 0}
          data={allFriendRequests?.received}
          renderItem={renderIncomingRequest}
          emptyMessage="No rizz uh??"
          emptyCharacter="rosie"
        />
        
        <RequestSection
          title="Sent"
          count={allFriendRequests?.sent?.length || 0}
          data={allFriendRequests?.sent}
          renderItem={renderOutgoingRequest}
          emptyMessage="Not interested in making friends?"
          emptyCharacter="steve"
          containerStyle="mt-4"
        />
      </View>
    </View>
  );
};

const FriendItem = ({ item, onViewProfile }) => {
  const displayName = item.friend_nickname || item.friend_username;
  const location = item.city !== item.state
    ? `${item.city}, ${item.state}, ${item.country}`
    : `${item.state}, ${item.country}`;

  return (
    <ItemContainer
      label={displayName}
      caption={location}
      colors={["#93c5fd", "#93c5fd"]}
      icon={icons.user}
      iconColor="#000"
      actionIcon={icons.chevron}
      onPress={() => {
        onViewProfile(item.friend_id, displayName);
      }}
    />
  );
};

const SearchHeader = ({ searchText, setSearchText, onClear }) => (
  <View
    className="absolute z-10 flex flex-row items-center bg-white rounded-[24px] px-4 mt-4 h-12 self-center"
    style={{
      boxShadow: "0 0 7px 1px rgba(120,120,120,.1)",
      width: "90%",
    }}
  >
    <Ionicons name="search" size={20} color="#9ca3af" />
    <TextInput
      className="flex-1 pl-2 text-md "
      placeholder="Search for a friend..."
      placeholderTextColor="#9CA3AF"
      value={searchText}
      onChangeText={setSearchText}
      returnKeyType="search"
    />
    {searchText.length > 0 && (
      <TouchableOpacity
        onPress={onClear}
        className="w-6 h-6 items-center justify-center"
      >
        <Ionicons name="close-circle" size={20} color="#9ca3af" />
      </TouchableOpacity>
    )}
  </View>
);

// Main Component
export const SocialScreen: React.FC = () => {
  const { user } = useUser();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  
  // State
  const [selectedTab, setSelectedTab] = useState<string>(tab || "Friends");
  const [searchText, setSearchText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserNicknamePair[]>([]);
  const [handlingFriendRequest, setHandlingFriendRequest] = useState<boolean>(false);

  // Context
  const {
    friendList,
    friendRequests: allFriendRequests,
    nicknames,
    refreshFriends,
    refreshFriendRequests,
    refreshNicknames
  } = useFriendsContext();

  // Handlers
  const handleAcceptRequest = async (senderId, receiverId) => {
    setHandlingFriendRequest(true);
    const returnStats = await acceptFriendRequest(senderId, receiverId);
    
    if (returnStats === FriendStatus.FRIENDS) {
      alert("Friend request accepted!");
    } else {
      alert("Error when trying to accept friend request.");
    }
    
    fetchFriendData();
    setHandlingFriendRequest(false);
  };

  const handleRejectRequest = async (senderId, receiverId) => {
    setHandlingFriendRequest(true);
    const returnStats = await rejectFriendRequest(senderId, receiverId);
    
    if (returnStats === FriendStatus.NONE) {
      alert("Friend request rejected!");
    } else {
      alert("Error when trying to reject friend request.");
    }

    fetchFriendData();
    setHandlingFriendRequest(false);
  };

  const handleUserProfile = (userId: string, username: string) => {
    router.push({
      pathname: "/root/profile/[id]",
      params: { id: userId, username },
    });
  };

  const handleClearSearch = () => {
    setSearchText("");
    Keyboard.dismiss();
  };

  const handleTabChange = (tabName: string) => {
    setSelectedTab(tabName);
    setSearchText("");
  };

  // Data fetching
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetchAPI(`/api/chat/searchUsers?id=${user!.id}`, {
        method: "GET",
      });
      if (response.error) {
        throw new Error(response.error);
      }
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      setError("Failed to fetch nicknames.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshFriends(),
        refreshFriendRequests(),
        refreshNicknames()
      ]);
    } catch (err) {
      console.error("Error fetching friend data:", err);
      setError("Failed to load friend data");
    } finally {
      setLoading(false);
    }
  };

  // Filtered data
  const filteredFriendList = friendList.filter((friend) =>
    searchText.length > 0
      ? friend.friend_nickname
        ? friend.friend_nickname.toLowerCase().includes(searchText.toLowerCase())
        : friend.friend_username.toLowerCase().includes(searchText.toLowerCase())
      : true
  );

  // Render functions
  const renderFriend = ({ item }) => (
    <FriendItem item={item} onViewProfile={handleUserProfile} />
  );

  const renderUser = ({ item }: { item: UserNicknamePair }) => (
    <ItemContainer
      label={item[1]}
      colors={["#FBB1F5", "#CFB1FB"]}
      icon={icons.user}
      actionIcon={icons.chevron}
      iconColor="#000"
      onPress={() => {
        router.push({
          pathname: "/root/profile/[id]",
          params: { id: item[0], username: item[1] },
        });
      }}
    />
  );

  // Effects
  useEffect(() => {
    fetchUsers();
    fetchFriendData();
  }, []);

  return (
    <TouchableWithoutFeedback
      className="flex-1"
      onPress={() => Keyboard.dismiss()}
    >
      <View className="flex-1 px-6" style={{ height: screenHeight * 0.6 }}>
        {/* Tab Navigation */}
        <View className="w-full flex-row items-start justify-between">
          <TabNavigation
            name="Find"
            focused={selectedTab === "Find"}
            onPress={() => handleTabChange("Find")}
            notifications={0}
          />
          <TabNavigation
            name="Friends"
            focused={selectedTab === "Friends"}
            onPress={() => handleTabChange("Friends")}
            notifications={0}
          />
          <TabNavigation
            name="Requests"
            focused={selectedTab === "Requests"}
            onPress={() => setSelectedTab("Requests")}
            notifications={allFriendRequests ? allFriendRequests.received.length : 0}
          />
        </View>

        {/* Tab Content */}
        {selectedTab === "Find" && (
          <View className="flex-1">
            { error ? (
              <Text>{error}</Text>
            ) : (
              <View className="flex-1 h-full">
                <FindUser selectedUserInfo={(item: UserNicknamePair) => {
                  router.push({
                    pathname: "/root/profile/[id]",
                    params: { id: item[0], username: item[1] },
                  });
                }} />
              </View>
            )}
          </View>
        )}

        {selectedTab === "Friends" && (
          <View className="flex-1">
            <SearchHeader
              searchText={searchText}
              setSearchText={setSearchText}
              onClear={handleClearSearch}
            />
            <FlatList
              className="rounded-[16px]"
              data={filteredFriendList}
              contentContainerStyle={{
                marginTop: 80,
                paddingBottom: 90,
              }}
              renderItem={renderFriend}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <EmptyListView message={"Pfffft... friendless?"} character="bob" mood={1} />
              }
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {selectedTab === "Requests" && (
          <FriendRequestsView
            allFriendRequests={allFriendRequests}
            nicknames={nicknames}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            onViewProfile={handleUserProfile}
            handlingFriendRequest={handlingFriendRequest}
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default SocialScreen;
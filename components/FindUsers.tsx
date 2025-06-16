import { useUser } from "@clerk/clerk-expo";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { PostItColor, UserNicknamePair, TextStyle, Post } from "@/types/type";
import { fetchFriends } from "@/lib/friend";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import ItemContainer from "@/components/ItemContainer";
import { Ionicons } from "@expo/vector-icons";
import EmptyListView from "./EmptyList";

interface FindUserProps {
  selectedUserInfo: (user: UserNicknamePair) => void;
  inGivenList?: string[];
}

export const FindUser: React.FC<FindUserProps> = ({
  selectedUserInfo,
  inGivenList,
}) => {
  const { user } = useUser();

  const [users, setUsers] = useState<UserNicknamePair[]>([]);
  const [friendList, setFriendList] = useState<UserNicknamePair[]>([]);
  const [searchText, setSearchText] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchUsers();
    fetchFriendList();
  }, []);

  const fetchFriendList = async () => {
    const data = await fetchFriends(user!.id);

    const friend = data.map((f) => [f.friend_id, f.friend_nickname ?? f.friend_username]);
    setFriendList(friend);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // //console.log("user: ", user!.id);
      let response;
      if (inGivenList) {
        console.log("Searching withing given list");
        response = await fetchAPI(
          `/api/chat/searchUsersInList?userId=${user!.id}&ids=${inGivenList}`,
          {
            method: "GET",
          }
        );
      } else {
        response = await fetchAPI(`/api/chat/searchUsers?id=${user!.id}`, {
          method: "GET",
        });
      }
      if (response.error) {
        throw new Error(response.error);
      }
      const nicknames = response.data;
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
      icon={icons.user}
      actionIcon={icons.chevron}
      iconColor="#000"
      onPress={() => {
        selectedUserInfo(item);
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

  const handleClearSearch = () => {
    setSearchText("");
  };
  return (
    <View className="flex-1 ">
      <View className="flex-1 mt-4 mx-4">
        <View
          className="flex flex-row items-center bg-white rounded-[24px] px-4 h-12 "
          style={{
            boxShadow: "0 0 7px 1px rgba(120,120,120,.1)",
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
              onPress={handleClearSearch}
              className="w-6 h-6 items-center justify-center"
            >
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ColoreActivityIndicator text="Summoning Bob..." />
        </View>
      ) : error ? (
        <Text>{error}</Text>
      ) : (
        <FlatList
          className={`mt-4 pb-4 flex-1`}
          contentContainerStyle={{ paddingBottom: 80 }}
          data={
            filteredUsers.length > 0
              ? filteredUsers
              : inGivenList
                ? users
                : friendList
          }
          renderItem={renderUser}
          ListEmptyComponent={
                  <EmptyListView message={"why has everyone now disappeared!"} character="alexelliot" mood={2} />
              }
          keyExtractor={(item): string => String(item[0])}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

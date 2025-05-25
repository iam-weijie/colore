import { useUser } from "@clerk/clerk-expo";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  View,
} from "react-native";
import { icons, temporaryColors } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { PostItColor, UserNicknamePair, TextStyle, Post } from "@/types/type";
import {
  fetchFriends
} from "@/lib/friend";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import ItemContainer from "@/components/ItemContainer";

export const FindUser = ({ selectedUserInfo }) => {
const { user } = useUser();

const [users, setUsers] = useState<UserNicknamePair[]>([]);
  const [friendList, setFriendList] = useState<UserNicknamePair[]>([]);
const [searchText, setSearchText] = useState<string>("");

const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState<boolean>(false);

console.log("Modal Showed")
useEffect(() => {
  fetchUsers(); 
  fetchFriendList();
}, [])

  const fetchFriendList = async () => {
    const data = await fetchFriends(user!.id);
    console.log("friend", data)
    const friend = data.map((f) => [f.friend_id, f.friend_username])
    setFriendList(friend);
  };

const fetchUsers = async () => {
        setLoading(true);
        try {
          // //console.log("user: ", user!.id);
          const response = await fetchAPI(`/api/chat/searchUsers?id=${user!.id}`, {
            method: "GET",
          });
          if (response.error) {
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

   const renderUser = ({
      item,
    }: {
      item: UserNicknamePair;
    }): React.ReactElement => (
            <ItemContainer 
            label={item[1]}
            colors={["#FBB1F5", "#CFB1FB"]}
            icon={icons.addUser}
            actionIcon={icons.chevron}
            iconColor="#000"
            onPress={() => {
              selectedUserInfo(item)
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

    return (
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
                                              className={`mt-4 pb-4`}
                                              contentContainerStyle={{ paddingBottom: 80 }} 
                                                data={filteredUsers.length > 0 ? filteredUsers : friendList}
                                                renderItem={renderUser}
                                                keyExtractor={(item): string => String(item[0])}
                                                showsVerticalScrollIndicator={false}
                                              />
                                            )}
                  </View>
    )
}

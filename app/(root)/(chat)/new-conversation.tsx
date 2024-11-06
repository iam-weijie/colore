import CustomButton from "@/components/CustomButton";
import React, { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/fetch";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { UserProfileType, UserNicknamePair} from "@/types/type";

const NewConversation = (): React.ReactElement => {
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<UserNicknamePair[]>([]);
  const [nicknames, setNicknames] = useState<UserNicknamePair[]>([]);
  const { user } = useUser();
  const router = useRouter();

  const fetchNicknames = async () => {
    try {
        // console.log("user: ", user!.id);
        const response = await fetchAPI(
          `/(api)/(users)/getUserInfo?id=${user!.id}`,
          {
            method: "GET",
          }
        );
        if (response.error) {
          console.log("Error fetching user data");
          console.log("response data: ", response.data);
          console.log("response status: ", response.status);
          // console.log("response: ", response);
          throw new Error(response.error);
        }
        // console.log("response: ", response.data[0].nicknames);
        const nicknames = response.data[0].nicknames || [];
        setNicknames(nicknames);
        return;
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
    useEffect(() => {
        fetchNicknames();
        console.log("nicknames: ", nicknames);
        setUsers(nicknames);
    }, []);

  const filteredUsers = users.filter((user) =>
    user[1].includes(searchText.toLowerCase())
  );

  const startChat = (user: UserNicknamePair): void => {
    console.log(`Starting chat with ${user[1]}`);
    // TODO: Add your logic for initiating a chat here
  };
  const showProfile = (user: UserProfileType): void => {
    
    // TODO: Actually show the profile
  };

  const renderUser = ({ item }: { item: UserNicknamePair }): React.ReactElement => (
    <View className="flex flex-row justify-between items-center p-4 border-b border-gray-200">
      <TouchableOpacity onPress={() => {
              router.push({
                pathname: "/(root)/(profile)/[id]",
                params: { id: item[0] },
              });
              }}>
        <Text className="text-lg text-black">
          {item[1]}
        </Text>
      </TouchableOpacity>
      <CustomButton
        title="Chat"
        onPress={() => startChat(item)}
        disabled={!item[1]}
        className="w-14 h-8 rounded-md"
        fontSize="sm"
        padding="0"
      />
    </View>
  );

  // Simulating API call to fetch users

  return (
    <View className="flex-1 bg-gray-100 pt-16">
      <TextInput
        className="h-11 mx-4 px-4 rounded-lg border border-gray-300 text-base focus:outline-none focus:border-blue-500 focus:ring-blue-500"
        placeholder="Search users..."
        placeholderTextColor="#4a4a4a"
        value={searchText}
        onChangeText={(text): void => setSearchText(text)}
      />
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item): string => String(item.id)}
      />
    </View>
  );
};

export default NewConversation;

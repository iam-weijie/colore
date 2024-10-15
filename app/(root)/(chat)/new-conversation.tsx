import CustomButton from "@/components/CustomButton";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { User } from "../../../types/type";

const NewConversation = (): React.ReactElement => {
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<User[]>([]);

  const filteredUsers = users.filter((user) =>
    (
      user.first_name.toLowerCase() +
      " " +
      user.last_name.toLowerCase()
    ).includes(searchText.toLowerCase())
  );

  const startChat = (user: User): void => {
    console.log(`Starting chat with ${user.first_name} ${user.last_name}`);
    // TODO: Add your logic for initiating a chat here
  };
  const showProfile = (user: User): void => {
    console.log(`Showing profile of ${user.first_name} ${user.last_name}`);
    // TODO: Actually show the profile
  };

  const renderUser = ({ item }: { item: User }): React.ReactElement => (
    <View className="flex flex-row justify-between items-center p-4 border-b border-gray-200">
      <TouchableOpacity onPress={() => showProfile(item)}>
        <Text className="text-lg text-black">
          {item.first_name + " " + item.last_name}
        </Text>
      </TouchableOpacity>
      <CustomButton
        title="Chat"
        onPress={() => startChat(item)}
        disabled={!item.id || !item.first_name || !item.last_name}
        className="w-14 h-8 rounded-md"
        fontSize="sm"
        padding="0"
      />
    </View>
  );

  // Simulating API call to fetch users
  useEffect(() => {
    const fetchUsers = async (): Promise<void> => {
      const fetchedUsers: User[] = [
        { id: 1, first_name: "John", last_name: "Doe" },
        { id: 2, first_name: "Jane", last_name: "Smith" },
        { id: 3, first_name: "This", last_name: "is" },
        { id: 4, first_name: "a", last_name: "placeholder" },
        //TODO: actually get users from db
      ];
      setUsers(fetchedUsers);
    };
    fetchUsers();
  }, []);

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

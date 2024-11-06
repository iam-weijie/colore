import CustomButton from "@/components/CustomButton";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { UserProfileType } from "@/types/type";

const NewConversation = (): React.ReactElement => {
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<UserProfileType[]>([]);

  const filteredUsers = users.filter((user) =>
    (
      user.firstname.toLowerCase() +
      " " +
      user.lastname.toLowerCase()
    ).includes(searchText.toLowerCase())
  );

  const startChat = (user: UserProfileType): void => {
    console.log(`Starting chat with ${user.firstname} ${user.lastname}`);
    // TODO: Add your logic for initiating a chat here
  };
  const showProfile = (user: UserProfileType): void => {
    console.log(`Showing profile of ${user.firstname} ${user.lastname}`);
    // TODO: Actually show the profile
  };

  const renderUser = ({ item }: { item: UserProfileType }): React.ReactElement => (
    <View className="flex flex-row justify-between items-center p-4 border-b border-gray-200">
      <TouchableOpacity onPress={() => showProfile(item)}>
        <Text className="text-lg text-black">
          {item.firstname + " " + item.lastname}
        </Text>
      </TouchableOpacity>
      <CustomButton
        title="Chat"
        onPress={() => startChat(item)}
        disabled={!item.id || !item.firstname || !item.lastname}
        className="w-14 h-8 rounded-md"
        fontSize="sm"
        padding="0"
      />
    </View>
  );

  // Simulating API call to fetch users
  useEffect(() => {
    const fetchUsers = async (): Promise<void> => {
      const fetchedUsers: UserProfileType[] = [
        { id: 1, firstname: "John", lastname: "Doe" },
        { id: 2, firstname: "Jane", lastname: "Smith" },
        { id: 3, firstname: "This", lastname: "is" },
        { id: 4, firstname: "a", lastname: "placeholder" },
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

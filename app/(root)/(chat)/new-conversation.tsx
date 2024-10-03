import React, { useEffect, useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";
import { User } from "../../../types/type";

const NewConversation = (): React.ReactElement => {
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<User[]>([]);

  const filteredUsers = users.filter((user) =>
    (user.first_name.toLowerCase() + " " + user.last_name.toLowerCase()).includes(searchText.toLowerCase())
  );

  const renderUser = ({ item }: { item: User }): React.ReactElement => (
    <View className="flex flex-row justify-between items-center p-4 border-b border-gray-200">
      <Text className="text-lg">{item.first_name + " " + item.last_name}</Text>
    </View>
  );

  // Simulating API call to fetch users
  useEffect(() => {
    const fetchUsers = async (): Promise<void> => {
      const fetchedUsers: User[] = [
        { id: 1, first_name: "John", last_name: "Doe"},
        { id: 2, first_name: "Jane", last_name: "Smith"},
        // Add more users here...
      ];
      setUsers(fetchedUsers);
    };
    fetchUsers();
  }, []);

  return (
    <View className="flex-1 bg-gray-100 pt-16">
      <TextInput
        className="h-12 mx-4 px-4 rounded-lg border border-gray-300 text-base focus:outline-none focus:border-blue-500 focus:ring-blue-500"
        placeholder="Search users..."
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

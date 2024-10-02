import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { User } from "../types";

const NewConversation = (): React.ReactElement => {
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<User[]>([]);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderUser = ({ item }: { item: User }): React.ReactElement => (
    <View style={styles.userItem}>
      <Text>{item.name}</Text>
    </View>
  );

  // Simulating API call to fetch users
  useEffect(() => {
    const fetchUsers = async (): Promise<void> => {
      const fetchedUsers: User[] = [
        { id: "user1", name: "John Doe" },
        { id: "user2", name: "Jane Smith" },
        // Add more users here...
      ];
      setUsers(fetchedUsers);
    };
    fetchUsers();
  }, []);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search users..."
        value={searchText}
        onChangeText={(text): void => setSearchText(text)}
      />
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item): string => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 64,
  },
  searchBar: {
    height: 50,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
  },
  userItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});

export default NewConversation;

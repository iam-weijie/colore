import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, StyleSheet, Text } from 'react-native';

interface UserItem {
  id: string;
  name: string;
}

export default function SearchUserScreen(): React.ReactElement {
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState<UserItem[]>([]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderUserItem = ({ item }: { item: UserItem }): React.ReactElement => (
    <View style={styles.userItem}>
      <Text>{item.name}</Text>
    </View>
  );

  // Simulating API call to fetch users
  useEffect(() => {
    const fetchUsers = async (): Promise<void> => {
      const fetchedUsers: UserItem[] = [
        { id: 'user1', name: 'John Doe' },
        { id: 'user2', name: 'Jane Smith' },
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
        renderItem={renderUserItem}
        keyExtractor={(item): string => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 64,
  },
  searchBar: {
    height: 50,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
  },
  userItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
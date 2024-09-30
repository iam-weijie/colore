import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet } from 'react-native';


interface ConversationItem {
  id: number;
  name: string;
  lastMessage: string;
}

const Chat: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const conversations: ConversationItem[] = [
    { id: 1, name: 'John Doe', lastMessage: 'Hello!' },
    { id: 2, name: 'Jane Smith', lastMessage: 'How are you?' },
    { id: 3, name: 'Bob Johnson', lastMessage: 'Great, thanks!' },
    { id: 4, name: 'John Doe', lastMessage: 'Hello!' },
    { id: 5, name: 'Jane Smith', lastMessage: 'How are you?' },
    { id: 6, name: 'Bob Johnson', lastMessage: 'Great, thanks!' },
    { id: 7, name: 'John Doe', lastMessage: 'Hello!' },
    { id: 8, name: 'Jane Smith', lastMessage: 'How are you?' },
    { id: 9, name: 'Bob Johnson', lastMessage: 'Great, thanks!' },
    { id: 10, name: 'John Doe', lastMessage: 'Hello!' },
    { id: 11, name: 'Jane Smith', lastMessage: 'How are you?' },
    { id: 12, name: 'Bob Johnson', lastMessage: 'Great, thanks!' },
    { id: 13, name: 'John Doe', lastMessage: 'Hello!' },
    { id: 14, name: 'Jane Smith', lastMessage: 'How are you?' },
    { id: 15, name: 'Bob Johnson', lastMessage: 'Great, thanks!' },
    { id: 16, name: 'John Doe', lastMessage: 'Hello!' },
    { id: 17, name: 'Jane Smith', lastMessage: 'How are you?' },
    { id: 18, name: 'Bob Johnson', lastMessage: 'Great, thanks!' },
  ];

  const filteredConversations = conversations.filter(conversation =>
    conversation.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderConversationItem = ({ item }: { item: ConversationItem }) => (
    <View style={styles.conversationItem}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.lastMessage}>{item.lastMessage}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search conversations..."
          value={searchText}
          onChangeText={(text) => setSearchText(text)}
        />
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id.toString()}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 0,
  },
  searchBar: {
    height: 34,
    marginHorizontal: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
  },
  conversationItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lastMessage: {
    color: '#666',
    fontSize: 14,
  },
});

export default Chat;

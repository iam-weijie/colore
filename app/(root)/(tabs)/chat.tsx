import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from "expo-router";

interface ConversationItem {
  id: string;
  name: string;
  lastMessageContent: string;
  lastMessageTimestamp: Date;
}

interface ChatTabProps {}

const Chat: React.FC<ChatTabProps> = () => {
  const [searchText, setSearchText] = useState<string>('');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async (): Promise<void> => {
    // Simulating API call to fetch conversations
    const fetchedConversations: ConversationItem[] = [
      { id: 'conv1', name: "John Doe", lastMessageContent: 'Hello!', lastMessageTimestamp: new Date('2023-09-30T10:00:00Z') },
      { id: 'conv2', name: "John Doe", lastMessageContent: 'How are you?', lastMessageTimestamp: new Date('2023-09-30T11:00:00Z') },
      { id: 'conv3', name: "John Doe", lastMessageContent: 'Great, thanks!', lastMessageTimestamp: new Date('2023-09-30T12:00:00Z') },
    ];
    setConversations(fetchedConversations);
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderConversationItem = ({ item }: { item: ConversationItem }): React.ReactElement => (
    <View style={styles.conversationItem}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.lastMessage}>{item.lastMessageContent}</Text>
      <Text style={styles.timestamp}>{new Date(item.lastMessageTimestamp).toLocaleString()}</Text>
    </View>
  );

  const handleCreateNewConversation = (): void => {
    router.push("/(root)/(tabs)/(chat)/new-conversation");
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.searchBarContainer}>
          <View style={{ flex: 1 }}>
            <TextInput
              style={[styles.searchBar, { marginLeft: 8 }]}
              placeholder="Search conversations..."
              value={searchText}
              onChangeText={(text): void => setSearchText(text)}
            />
          </View>
          <TouchableOpacity onPress={handleCreateNewConversation} style={styles.createButton}>
            <Text style={styles.createButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
          keyExtractor={(item): string => item.id}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 64,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  searchBar: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
    marginRight: 8,
  },
  createButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  createButtonText: {
    fontSize: 26,
    color: 'white',
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
    marginBottom: 4,
  },
  timestamp: {
    color: '#999',
    fontSize: 12,
  },
});

export default Chat;
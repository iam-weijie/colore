import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  TextInput,
  Text, 
  TouchableOpacity,
  View,
} from "react-native";
import { ConversationItem, ChatTabProps } from "../../../types/type";


const Chat: React.FC<ChatTabProps> = () => {
  const [searchText, setSearchText] = useState<string>("");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async (): Promise<void> => {
    // Simulating API call to fetch conversations
    const fetchedConversations: ConversationItem[] = [
      {
        id: "conv1",
        name: "John Doe",
        lastMessageContent: "Hello!",
        lastMessageTimestamp: new Date("2023-09-30T10:00:00Z"),
      },
      {
        id: "conv2",
        name: "John Doe",
        lastMessageContent: "How are you?",
        lastMessageTimestamp: new Date("2023-09-30T11:00:00Z"),
      },
      {
        id: "conv3",
        name: "John Doe",
        lastMessageContent: "Great, thanks!",
        lastMessageTimestamp: new Date("2023-09-30T12:00:00Z"),
      },
    ];
    setConversations(fetchedConversations);
  };

  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderConversationItem = ({
    item,
  }: {
    item: ConversationItem;
  }): React.ReactElement => (
    <View className="flex flex-row justify-between items-center p-4 border-b border-gray-200">
      <View>
        <Text className="text-lg font-bold mb-2">{item.name}</Text>
        <Text className="text-gray-600 text-sm mb-2">{item.lastMessageContent}</Text>
      </View>
      <Text className="text-xs text-gray-400">{new Date(item.lastMessageTimestamp).toLocaleString()}</Text>
    </View>
  );

  const handleCreateNewConversation = (): void => {
    router.push("/(root)/(chat)/new-conversation");
  };

  return (
    <View className="flex-1 bg-gray-100">
      <View className="flex-1 pt-16">
        <View className="flex flex-row items-center mx-4 mb-4">
          <TextInput
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-base focus:outline-none focus:border-blue-500 focus:ring-blue-500"
            placeholder="Search conversations..."
            value={searchText}
            onChangeText={(text): void => setSearchText(text)}
          />
          <TouchableOpacity
            onPress={handleCreateNewConversation}
            className="w-10 h-10 ml-2 flex justify-center items-center bg-blue-600 rounded-full"
          >
            <Text className="text-white text-xl">+</Text>
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

export default Chat;  
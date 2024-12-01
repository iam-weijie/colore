import { ChatTabProps, ConversationItem } from "@/types/type";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { fetchAPI } from "@/lib/fetch";
import { useUser } from "@clerk/clerk-expo";

const Chat: React.FC<ChatTabProps> = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetchAPI(`/(api)/(chat)/getConversations?id=${user!.id}`, 
        { 
          method: "GET",
        }
      );
      const fetchedConversations = response.data;
      setConversations(fetchedConversations);
    } catch (error) {
      console.error("Failed to fetch conversations: ", error);
      setError("Failed to fetch conversations.");
    } finally {
      setLoading(false);
    }
  };
  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(searchText.toLowerCase())
  );
  

  const handleOpenChat = (conversation: ConversationItem): void => {
    //console.log(`Opening chat with conversation ID: ${conversation.id}`);
    router.push(`/(root)/(chat)/conversation?conversationId=${conversation.id}&otherClerkId=${conversation.clerk_id}&otherName=${conversation.name}`);
  };

  const renderConversationItem = ({
    item,
  }: {
    item: ConversationItem;
  }): React.ReactElement => (
    <TouchableOpacity onPress={() => handleOpenChat(item)}>
      <View className="flex flex-row justify-between items-center p-4 border-b border-gray-200">
        <View>
          <Text className="text-lg font-bold mb-2">{item.name}</Text>
          <Text className="text-gray-600 text-sm mb-2">
            {item.lastMessageContent ? item.lastMessageContent : "No messages yet"}
          </Text>
        </View>
        <Text className="text-xs text-gray-400">
          {item.lastMessageTimestamp ? new Date(item.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' , timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone}) : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const handleCreateNewConversation = (): void => {
    router.push("/(root)/(chat)/new-conversation");
  };

  return (
    <View className="flex-1 bg-gray-100">
      {loading ? 
      (<View className="flex-[0.8] justify-center items-center">
        <ActivityIndicator size="large" color="black" />
      </View>) :
      (<View className="flex-1 pt-16">
        <View className="flex flex-row items-center mx-4 mb-4">
          <TextInput
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-base focus:outline-none focus:border-blue-500 focus:ring-blue-500"
            placeholder="Search conversations..."
            value={searchText}
            onChangeText={(text): void => setSearchText(text)}
          />
          <TouchableOpacity
            onPress={handleCreateNewConversation}
            className="w-10 h-10 ml-2 flex justify-center items-center bg-black rounded-full"
          >
            <View className="flex justify-center items-center w-full h-full">
              <Text className="text-white text-3xl -mt-[3px]">+</Text>
            </View>
          </TouchableOpacity>
        </View>
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
          keyExtractor={(item): string => item.id}
        />
      </View>)}
    </View>
  );
};

export default Chat;

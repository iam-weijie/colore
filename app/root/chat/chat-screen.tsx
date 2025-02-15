import { fetchAPI } from "@/lib/fetch";
import { ConversationItem } from "@/types/type";
import NotificationBubble from "@/components/NotificationBubble";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

declare interface ChatScreenProps {}

const ChatScreen: React.FC<ChatScreenProps> = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [toRead, setToRead] = useState<[]>([])


  const fetchConversations = async (): Promise<void> => {
    setLoading(true);
    try {
      const responseConversation = await fetchAPI(
        `/api/chat/getConversations?id=${user!.id}`,
        {
          method: "GET",
        }
      );
  
      const responseNotifications = await fetch(`/api/notifications/getMessages?id=${user!.id}`);
      if (!responseNotifications) {
        throw new Error("Response is undefined.");
      }
      const responseData = await responseNotifications.json();
      
      const chatNotifications = responseData.toRead; // Notifications data
      const fetchedConversations = responseConversation.data; // Conversations data
  

      // Merge conversations with unread count from chatNotifications
      const conversationsWithUnread = fetchedConversations.map((conversation: any) => {
        
        const matchingNotification = chatNotifications.filter(
          (notif: any) => notif.conversationid == conversation.id
        );
        return {
          ...conversation, // Spread existing conversation data
          unread_messages: matchingNotification ? matchingNotification.length : 0, // Add unread_count
        };
      });
  
      setToRead(chatNotifications)
      setConversations(conversationsWithUnread);
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
    router.push(
      `/root/chat/conversation?conversationId=${conversation.id}&otherClerkId=${conversation.clerk_id}&otherName=${conversation.name}`
    );
  };

  const renderConversationItem = ({
    item,
  }: {
    item: ConversationItem;
  }): React.ReactElement => (
    <TouchableOpacity onPress={() => handleOpenChat(item)}>
      <View className="flex items-center p-4 m-2 border-b border-gray-200">
        <View className="w-full">
          <View className="flex flex-row justify-between items-center">
          <Text className="text-lg font-bold mb-1">{item.name}</Text>
          <Text className="text-xs text-gray-400">
          {item.lastMessageTimestamp
            ? new Date(item.lastMessageTimestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              })
            : ""}
        </Text>
          </View>
          {item.lastMessageContent ?
            <View className="flex flex-row items-start justify-between -mt-1">
              
              <Text className="text-sm" style={{ fontWeight:item.unread_messages ? 600 : 400 }}>{item.lastMessageContent}</Text>
              {item.unread_messages &&  <NotificationBubble unread={item.unread_messages} color={"#000000"} />}
            </View>
           : 
            <Text className="text-gray-600 text-sm -mt-1 mb-2">
           "No messages yet"
          </Text>
          }
          
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleCreateNewConversation = (): void => {
    router.push("/root/chat/new-conversation");
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Fetch data when the screen is focused
      fetchConversations();

      // Optionally, you can return a cleanup function
      return () => {
        // Cleanup logic here, if needed
      };
    }, [])
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-gray-100">
        {loading ? (
          <View className="flex-[0.8] justify-center items-center">
            <ActivityIndicator size="large" color="black" />
          </View>
        ) : (
          <View className="flex-1">
            <View className="flex flex-row items-center mx-4 mb-4 mt-4">
              <View className="mr-2">
                <TouchableOpacity onPress={() => router.back()}>
                  <AntDesign name="caretleft" size={18} color="0076e3" />
                </TouchableOpacity>
              </View>
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
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;

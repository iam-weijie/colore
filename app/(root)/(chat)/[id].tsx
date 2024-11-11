import CustomButton from "@/components/CustomButton";
import { Message } from "@/types/type";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";

const Conversation = () => {
  const {
    conversationId,
    otherClerkId,
    otherName
  } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Simulating fetching messages for the conversation
    const fetchMessages = async (): Promise<void> => {
      // Mock messages
      const fetchedMessages: Message[] = [
        {
          id: 1,
          content: "Hello!",
          senderId: "John Doe",
          timestamp: new Date("2023-09-30T10:00:00Z"),
        },
        {
          id: 2,
          content: "How are you?",
          senderId: "You",
          timestamp: new Date("2023-09-30T10:01:00Z"),
        },
        {
          id: 3,
          content: "I'm doing great, thanks!",
          senderId: "John Doe",
          timestamp: new Date("2023-09-30T10:02:00Z"),
        },
      ];
      setMessages(fetchedMessages);
    };
    fetchMessages();
  }, [conversationId]);
  const scrollToBottom = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, []);

  const handleSendMessage = (): void => {
    if (newMessage.trim().length === 0) return;

    // Create new message object generate an ID in a normal way later
    const newMessageObj: Message = {
      id: messages.length + 1,
      content: newMessage,
      senderId: "You", //TODO: set sender to user ID eventually
      timestamp: new Date(),
    };

    // Update the state to include the new message
    setMessages((prevMessages) => [...prevMessages, newMessageObj]);
    setNewMessage("");

    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };
  const renderMessageItem = ({
    item,
  }: {
    item: Message;
  }): React.ReactElement => (
    <View
      className={`p-2 my-1 rounded-lg ${
        item.senderId === "You"
          ? "bg-black text-white ml-auto max-w-[70%]"
          : "bg-gray-200 mr-auto max-w-[70%]"
      }`}
    >
      <Text
        className={`font-bold ${item.senderId === "You" ? "text-white" : "text-black"}`}
      >
        {item.senderId}
      </Text>
      <Text
        className={`${item.senderId === "You" ? "text-white" : "text-black"}`}
      >
        {item.content}
      </Text>
      <Text className="text-xs text-gray-500">
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={"padding"} style={{ flex: 1 }}>
        <View className="flex-1 bg-gray-100">
          <FlatList
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            style={{ flexGrow: 1 }}
            extraData={messages}
          />
          <View className="flex-row items-center p-4 border-t border-gray-200">
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={(text) => setNewMessage(text)}
              style={{ height: 44 }}
            />
            <CustomButton
              title="Send"
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
              className="ml-3 w-14 h-11 rounded-md"
              fontSize="sm"
              padding="0"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Conversation;

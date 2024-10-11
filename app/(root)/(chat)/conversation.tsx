import React, { useEffect, useState } from "react";
import { FlatList, TextInput, Text, View, TouchableOpacity } from "react-native";
import { Message } from "@/types/type"; 
import { useLocalSearchParams } from "expo-router";

const Conversation: React.FC = () => {
  const searchParams = useLocalSearchParams();
  const conversationId = searchParams.conversationId;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");

  useEffect(() => {
    // Simulating fetching messages for the conversation
    const fetchMessages = async (): Promise<void> => {
      // Mock messages
      const fetchedMessages: Message[] = [
        {
          id: "msg1",
          content: "Hello!",
          senderId: "John Doe",
          timestamp: new Date("2023-09-30T10:00:00Z"),
        },
        {
          id: "msg2",
          content: "How are you?",
          senderId: "You",
          timestamp: new Date("2023-09-30T10:01:00Z"),
        },
        {
          id: "msg3",
          content: "I'm doing great, thanks!",
          senderId: "John Doe",
          timestamp: new Date("2023-09-30T10:02:00Z"),
        },
      ];
      setMessages(fetchedMessages);
    };
    fetchMessages();
  }, [conversationId]);

  const handleSendMessage = (): void => {
    if (newMessage.trim().length === 0) return; 

    // Create new message object generate an ID in a normal way later
    const newMessageObj: Message = {
      id: `msg${messages.length + 1}`, 
      content: newMessage,
      senderId: "You", //TODO: set sender to user ID eventually
      timestamp: new Date(),
    };

    // Update the state to include the new message
    setMessages((prevMessages) => [...prevMessages, newMessageObj]);
    setNewMessage(""); // Clear the input after sending
  };

  const renderMessageItem = ({ item }: { item: Message }): React.ReactElement => (
    <View
      className={`p-2 my-1 rounded-lg ${
        item.senderId === "You" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
      }`}
    >
      <Text className="font-bold">{item.senderId}</Text>
      <Text>{item.content}</Text>
      <Text className="text-xs text-gray-500">
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100">
      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        
      />
      <View className="flex-row items-center p-4 border-t border-gray-200">
        <TextInput
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={(text) => setNewMessage(text)}
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          className="ml-2 bg-blue-600 px-4 py-2 rounded-lg"
        >
          <Text className="text-white">Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Conversation;

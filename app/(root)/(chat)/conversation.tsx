import CustomButton from "@/components/CustomButton";
import { Message } from "@/types/type";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  TouchableOpacity,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";
import { fetchAPI } from "@/lib/fetch";
import { useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router } from "expo-router";

const Conversation = () => {
  const {
    conversationId,
    otherClerkId,
    otherName
  } = useLocalSearchParams();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const flatListRef = useRef<FlatList<Message>>(null);

  
  const fetchMessages = async () => {
    const response = await fetchAPI(
      `/(api)/(chat)/getMessages?id=${conversationId}`, 
      {
        method: 'GET'}
      );
    setMessages(response.data);
    flatListRef.current?.scrollToEnd({ animated: true })
    console.log("Messages:", response.data);
    
  }

  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  const updateMessages = async (messageContent:string) => {
    await fetchAPI(`/(api)/(chat)/newMessage`,
      {
        method: 'POST',
        body: JSON.stringify({
          conversationId: conversationId,
          message: messageContent,
          senderId: user!.id,
          timestamp: new Date(),
        })
      });
  };
  const patchConversation = async (messageContent:string) => {
    await fetchAPI(`/(api)/(chat)/patchConversations`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          conversationId: conversationId,
          message: messageContent,
          timestamp: new Date(),
        })
      });
  };
  const handleSendMessage = (): void => {
    if (newMessage.trim().length === 0) return;

    const newMessageObj: Message = {
      id: messages.length + 1,
      content: newMessage,
      senderId: user!.id,
      timestamp: new Date(),
    };

    // Update the state to include the new message
    setMessages((prevMessages) => [...prevMessages, newMessageObj]);
    updateMessages(newMessage);
    flatListRef.current?.scrollToEnd({ animated: true })
    patchConversation(newMessage);
    flatListRef.current?.scrollToEnd({ animated: true })
    setNewMessage("");

  };
  const renderMessageItem = ({
    item,
  }: {
    item: Message;
  }): React.ReactElement => (
    <View
      className={`p-2 my-1 rounded-lg ${
        item.senderId === user?.id
          ? "bg-black text-white ml-auto max-w-[70%]"
          : "bg-gray-200 mr-auto max-w-[70%]"
      }`}
    >
      <Text
        className={`font-bold ${item.senderId == user?.id ? "text-white" : "text-black"}`}
      >
        {item.senderId === user?.id ? "You" : otherName}
      </Text>
      <Text
        className={`${item.senderId === user?.id ? "text-white" : "text-black"}`}
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
      <View className="flex flex-row items-center justify-between px-4 pt-2 pr-9">        
          <View className="mr-2">
            <TouchableOpacity onPress={() => router.replace("/(root)/(tabs)/chat")}>
              <AntDesign name="caretleft" size={18} color="0076e3" />
            </TouchableOpacity>
          </View>
          <Text className={`text-2xl font-JakartaBold flex-1 text-center`}>
            {otherName}
          </Text>
          </View>
        <View className="flex-1 bg-gray-100">
          {messages.length === 0 ? 
          ( <View className="flex-1 justify-center items-center">
              <Text className="text-lg text-gray-400">No messages yet</Text>
            </View>
          ) : (
          <FlatList
            ref = {flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id as unknown as string}
            contentContainerStyle={{ padding: 16 }}
            style={{ flexGrow: 1 }}
            extraData={messages}
          />)}
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

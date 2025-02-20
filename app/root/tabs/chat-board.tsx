import React from "react";
import { SignedIn } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native";
import ChatScreen from "@/app/root/chat/chat-screen";

const ChatBoard = () => {
  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <ChatScreen />
      </SignedIn>
    </SafeAreaView>
  );
};

export default ChatBoard;
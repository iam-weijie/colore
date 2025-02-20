import React from "react";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native";
import PersonalBoard from "@/components/PersonalBoard";

const ChatBoard = () => {
  const { user } = useUser();
  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <PersonalBoard userId={user!.id} />
      </SignedIn>
    </SafeAreaView>
  );
};

export default ChatBoard;
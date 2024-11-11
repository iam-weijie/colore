import CustomButton from "@/components/CustomButton";
import React, { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/fetch";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import {
  FlatList,
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { UserProfileType, UserNicknamePair} from "@/types/type";
import { SafeAreaView } from "react-native-safe-area-context";


const NewConversation = (): React.ReactElement => {
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<UserNicknamePair[]>([]);
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
        // console.log("user: ", user!.id);
        const response = await fetchAPI(
          `/(api)/(chat)/searchUsers?id=${user!.id}`,
          {
            method: "GET",
          }
        );
        if (response.error) {
          console.log("Error fetching user data");
          console.log("response data: ", response.data);
          console.log("response status: ", response.status);
          // console.log("response: ", response);
          throw new Error(response.error);
        }
        console.log("response: ", response.data);
        const nicknames = response.data;
        console.log("nicknames: ", nicknames);
        setUsers(nicknames);
        return;
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setError("Failed to fetch nicknames.");
      } finally {
        setLoading(false);
      }
    };
    useEffect(() => {
        fetchUsers();
        
    }, []);

  const filteredUsers = users.filter((user) =>
    user[1].includes(searchText.toLowerCase())
  );
  const checkIfChatExists = async (user2: UserNicknamePair) => {
    try {
      // console.log("user: ", user!.id);
      const response = await fetchAPI(
        `/(api)/(chat)/checkIfConversationExists?id1=${user!.id}&id2=${user2[0]}`,
        {
          method: "GET",
        }
      );
      if (response.error) {
        console.log("Error fetching user data");
        console.log("response data: ", response.data);
        console.log("response status: ", response.status);
        // console.log("response: ", response);
        throw new Error(response.error);
      }
      console.log("response: ", response.data.length);
      return response.data.length > 0;
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      setError("Failed to fetch nicknames.");
      return false;
    } 
  }
  const startChat = async (otherUser: UserNicknamePair) => {
    console.log(`Starting chat with ${otherUser[1]}`);
    const exists = await checkIfChatExists(otherUser);
    console.log("conversationExists: ", exists);
    if (exists) {
      Alert.alert("CHANGE THIS BEFORE MAKING A PR", "Chat already exists, with this user");
    }
    else {
      try {
        const response = await fetchAPI(
          `/(api)/(chat)/newConversation`,
          {
            method: "POST",
            body: JSON.stringify({
              clerkId_1: user!.id,
              clerkId_2: otherUser[0],
            }),
          }
        );
        if (response.error) {
          console.log("Error fetching user data");
          console.log("response data: ", response.data);
          console.log("response status: ", response.status);
          // console.log("response: ", response);
          throw new Error(response.error);
        }
        console.log("response: ", response.data);
        Alert.alert("CHANGE THIS BEFORE MAKING A PR", "Chat created successfully");
      } catch (err) {
        console.error("Failed to create new conversation:", err);
        setError("Failed to create new conversation");
      } 
    }
    // TODO: Add your logic for initiating a chat here
  };

  const renderUser = ({ item }: { item: UserNicknamePair }): React.ReactElement => (
    <View className="flex flex-row justify-between items-center p-4 border-b border-gray-200">
      <TouchableOpacity onPress={() => {
              router.push({
                pathname: "/(root)/(profile)/[id]",
                params: { id: item[0] },
              });
              }}>
        <Text className="text-lg text-black">
          {item[1]}
        </Text>
      </TouchableOpacity>
      <CustomButton
        title="Chat"
        onPress={() => startChat(item)}
        disabled={!item[1]}
        className="w-14 h-8 rounded-md"
        fontSize="sm"
        padding="0"
      />
    </View>
  );

  // Simulating API call to fetch users

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <View className="flex-1 bg-gray-100">
          <TextInput
            className="h-11 mx-4 px-4 rounded-lg border border-gray-300 text-base focus:outline-none focus:border-blue-500 focus:ring-blue-500"
            placeholder="Search users..."
            placeholderTextColor="#4a4a4a"
            value={searchText}
            onChangeText={(text): void => setSearchText(text)}
          />
          {loading ? (
            <View className="flex-[0.8] justify-center items-center">
            <ActivityIndicator size="large" color="black" />
          </View>
        ) : error ? (
          <Text>{error}</Text>
        ) : (
          <FlatList
            data={filteredUsers}
            renderItem={renderUser}
            keyExtractor={(item): string => String(item[0])}
          />)
        }
        </View>
      </SignedIn>
    </SafeAreaView>
  );
};

export default NewConversation;

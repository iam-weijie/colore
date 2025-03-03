import { useNavigationContext } from "@/components/NavigationContext";
import { fetchAPI } from "@/lib/fetch";
import { UserNicknamePair } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

const Nickname = () => {
  const router = useRouter();
  const { user } = useUser();
  const { stateVars, setStateVars } = useNavigationContext();
  const [nicknameText, setNicknameText] = useState<string>("");
  const [nicknames, setNicknames] = useState<UserNicknamePair[]>([]);
  const previousScreen = stateVars.previousScreen;

  const fetchCurrentNicknames = async () => {
    try {
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`, {
        method: "GET",
      });
      if (response.error) {
        //console.log("Error fetching user data");
        //console.log("response data: ", response.data);
        //console.log("response status: ", response.status);
        // //console.log("response: ", response);
        throw new Error(response.error);
      }
      return response.data[0].nicknames || [];
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };
  useEffect(() => {
    const getData = async () => {
      const data = await fetchCurrentNicknames();
      setNicknames(data);
    };
    getData();
  }, [user]);

  function findUserNickname(
    userArray: UserNicknamePair[],
    userId: string
  ): number {
    const index = userArray.findIndex((pair) => pair[0] === userId);
    return index;
  }

  const updateNicknames = async () => {
    // //console.log("Updating nicknames to: ", nicknames);
    await fetchAPI("/api/users/patchUserNicknames", {
      method: "PATCH",
      body: JSON.stringify({
        clerkId: user!.id,
        nicknames: nicknames,
      }),
    });
  };
  const handleNicknameConfirm = (): void => {
    if (findUserNickname(nicknames, stateVars.userId) === -1) {
      nicknames.push([stateVars.userId, nicknameText]);
    } else {
      nicknames[findUserNickname(nicknames, stateVars.userId)][1] =
        nicknameText;
    }
    updateNicknames();
    setStateVars({});
    router.back();
  };

  return (
    <View className="flex-1 bg-gray-100">
      <View className="flex-1 pt-16">
        <View className="flex flex-row items-center mx-4 mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <AntDesign name="caretleft" size={18} />
          </TouchableOpacity>
          <TextInput
            className="flex-1 px-4 w-full py-2 rounded-lg border border-gray-300 text-base focus:outline-none focus:border-blue-500 focus:ring-blue-500"
            placeholder="Add a nickname..."
            placeholderTextColor="#4a4a4a"
            value={nicknameText}
            onChangeText={(text): void => setNicknameText(text)}
          />
          <TouchableOpacity
            onPress={handleNicknameConfirm}
            className="w-10 h-10 ml-2 flex justify-center items-center bg-black rounded-full"
          >
            <View className="flex justify-center items-center w-full h-full">
              <Text className="text-white text-3xl -mt-[3px]">+</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Nickname;

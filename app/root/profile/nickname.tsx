import { useNavigationContext } from "@/components/NavigationContext";
import { fetchAPI } from "@/lib/fetch";
import { UserNicknamePair } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

const NicknameView = ({ onUpdate }: { onUpdate: () => void}) => {
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
    const response = await fetchAPI("/api/users/updateUserNicknames", {
      method: "PATCH",
      body: JSON.stringify({
        clerkId: user!.id,
        nicknames: nicknames,
      }),
    });

    if (response) {  onUpdate() }
  };
  const handleNicknameConfirm = (): void => {
    if (findUserNickname(nicknames, stateVars.userId) === -1) {
      nicknames.push([stateVars.userId, nicknameText]);
    } else {
      nicknames[findUserNickname(nicknames, stateVars.userId)][1] =
        nicknameText;
    }
    updateNicknames();

  };

  return (

      <View className="flex-1 w-full h-full">
        <View className="flex flex-row items-center mx-4 mb-4">
          <View className="relative flex-1 flex flex-row items-center justify-between bg-white rounded-[32px] px-4 h-[48px] mx-2 mb-2 "
        style={{
          boxShadow: "0 0 7px 1px rgba(150,150,150,.15)"
        }}
        >
          <TextInput
            className="flex-1 pl-2 text-[14px]"
            placeholder="Add a nickname..."
            placeholderTextColor="#4a4a4a"
            value={nicknameText}
            onChangeText={(text): void => setNicknameText(text)}
          />
          </View>
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
  );
};

export default NicknameView;

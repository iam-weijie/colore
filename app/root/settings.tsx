// Need to configure Email Verification & Update

import { fetchAPI } from "@/lib/fetch";
import { UserProfileType } from "@/types/type";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useNavigationContext } from "@/components/NavigationContext";

const Settings = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { stateVars, setStateVars } = useNavigationContext();
  const [profileUser, setProfileUser] = useState<UserProfileType | null>(null);

  const fetchUserData = async () => {
    try {
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`);
      const data = response.data[0];
      setProfileUser(data);
      setUsername(data.username || "");
      setEmail(data.email || "");
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const verifyValidUsername = (username: string): boolean => {
    const usernameRegex = /^[\w\-\.]{1,20}$/;
    return usernameRegex.test(username);
  };

  const handleUsernameUpdate = async () => {
    if (!verifyValidUsername(newUsername)) {
      Alert.alert(
        "Invalid Username",
        "Username can only contain alphanumeric characters, '_', '-', and '.' and must be at most 20 characters long"
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetchAPI("/api/users/patchUserInfo", {
        method: "PATCH",
        body: JSON.stringify({
          clerkId: user!.id,
          username: newUsername,
        }),
      });

      console.log("Changed Username", response)
      if (response.error) {
        if (response.error.includes("already taken")) {
          Alert.alert(
            "Username taken",
            `Username ${username} already exists. Please try another one.`
          );
        } else {
          throw new Error(response.error);
        }
      } else {
        Alert.alert("Success", "Username updated successfully");
        await fetchUserData();
      }
    } catch (error) {
      console.error("Failed to update username:", error);
      Alert.alert("Error", "Failed to update username. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationUpdate = () => {
    setStateVars({
      ...stateVars,
      previousScreen: "settings",
    });
    router.push({
      pathname: "/root/location/country",
      params: { previousScreen: "settings" },
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/auth/log-in");
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  const currentLocation = profileUser
    ? `${profileUser.city}, ${profileUser.state}, ${profileUser.country}`
    : "No location set";

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView className="flex-1">
          <View className="flex flex-row items-center px-4 pt-2">
            <View>
            <TouchableOpacity
              onPress={() => router.push("/root/tabs/profile")}
              className="mr-2"
            >
              <AntDesign name="caretleft" size={18} />
            </TouchableOpacity>
            </View>
            <View>
              <Text className="font-JakartaBold text-2xl">
                Settings
              </Text>
            </View>
          </View>
          <View className=" m-4">
          <Text className="ml-2 text-xl font-JakartaSemiBold mb-4">
                Account
              </Text>
            <View className="bg-[#fafafa] rounded-[32px] p-5">
              <View className="flex flex-row items-center justify-between -mb-14 p-2">
                <Text className="text-lg font-JakartaSemiBold">Username</Text>
                <TouchableOpacity
                  activeOpacity={0.5}
                  className="p-5 items-center"
                  onPress={() => {
                    console.log("Pressed")
                   if (!newUsername || loading) {
                      return;
                    }
                    handleUsernameUpdate();
                    setUsername(newUsername)
                    setNewUsername("");

                  }}
                  
                > 
                <Text className="text-md text-indigo-700 font-JakartaSemiBold">
                Update
                </Text>
                </TouchableOpacity>
              </View>
              <InputField
                label=""
                value={newUsername}
                onChangeText={setNewUsername}
                placeholder={username || "Enter username"}
               
              />
              <View className="flex flex-row items-center justify-between -mb-14 p-2">
                <Text className="text-lg font-JakartaSemiBold">
                  Email Address
                </Text>
                <TouchableOpacity
                  activeOpacity={0.5}
                  className="p-5 items-center"
                 >
                <Text className="text-md text-indigo-700 font-JakartaSemiBold">
                    Update
                </Text>
                 
                </TouchableOpacity>
              </View>
              <InputField
                label=""
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder={profileUser?.email || "Enter email address"}
                containerStyle="mb-4"
              />
              <View className="mb-4 mx-2">
                <View className="flex flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-JakartaSemiBold ">
                    Location
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.5}
                    onPress={handleLocationUpdate}
                  >
                   <Text className="text-md text-indigo-700 font-JakartaSemiBold">
                    Update
                </Text>
                  </TouchableOpacity>
                  
                </View>

                <Text className="text-gray-500 mb-2">
                  Current location: {currentLocation}
                </Text>
              </View>
            </View>

            <View className="my-[36px]">
              <TouchableOpacity onPress={handleSignOut}>
                <Text className="font-JakartaBold text-xl text-red-500 text-center">
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Settings;

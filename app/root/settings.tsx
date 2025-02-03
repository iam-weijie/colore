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
import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useNavigationContext } from "@/components/NavigationContext";

const Settings = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { stateVars, setStateVars } = useNavigationContext();
  const [profileUser, setProfileUser] = useState<UserProfileType | null>(null);

  const fetchUserData = async () => {
    try {
      const response = await fetchAPI(`/api/users/getUserInfoPosts?id=${user!.id}`);
      const { userInfo } = response;
      setProfileUser(userInfo);
      setUsername(userInfo.username || '');
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
    if (!verifyValidUsername(username)) {
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
          username: username,
        }),
      });

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
      previousScreen: "settings"
    });
    router.push({
      pathname: "/root/location/country",
      params: { previousScreen: "settings" }
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
            <TouchableOpacity onPress={() => router.push("/root/tabs/profile")} className="mr-4">
              <AntDesign name="caretleft" size={18} />
            </TouchableOpacity>
          </View>

          <View className="px-7">
            <Text className="text-2xl font-JakartaBold mb-8">Settings</Text>
            
            <View className="mb-8">
              <InputField
                label="Username"
                value={username}
                onChangeText={setUsername}
                placeholder={profileUser?.username || "Enter username"}
                containerStyle="mb-4"
              />
              <CustomButton
                title="Update Username"
                onPress={handleUsernameUpdate}
                disabled={loading || !username}
                bgVariant="gradient"
                className="w-full"
                padding="3"
              />
            </View>

            <View className="mb-8">
              <Text className="text-lg font-JakartaSemiBold mb-2">Current Location</Text>
              <Text className="text-gray-500 mb-4">{currentLocation}</Text>
              <CustomButton
                title="Change Location"
                onPress={handleLocationUpdate}
                bgVariant="gradient"
                className="w-full"
                padding="3"
              />
            </View>

            <CustomButton
              title="Sign Out"
              onPress={handleSignOut}
              bgVariant="danger"
              className="w-full"
              padding="3"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Settings;
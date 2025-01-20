import { fetchAPI } from "@/lib/fetch";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import React, { useState } from "react";
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
  const [username, setUsername] = useState(user?.username || "");
  const [loading, setLoading] = useState(false);
  const { stateVars, setStateVars } = useNavigationContext();

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

  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView className="flex-1">
            <View className="flex flex-row items-center justify-between px-4 pt-2">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.push("/root/tabs/profile")}>
                    <AntDesign name="caretleft" size={18} color="0076e3" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-JakartaBold ml-4">Settings</Text>
                </View>
            </View>

          <View className="p-4">
            <View className="mb-6">
              <Text className="text-xl font-JakartaSemiBold mb-4">Account</Text>
              <InputField
                label="Username"
                value={username}
                onChangeText={setUsername}
                containerStyle="mb-4"
              />
              <CustomButton
                title="Update Username"
                onPress={handleUsernameUpdate}
                disabled={loading || !username}
                className="mt-2"
              />
            </View>

            <View className="mb-6">
              <Text className="text-xl font-JakartaSemiBold mb-4">Location</Text>
              <CustomButton
                title="Change Location"
                onPress={handleLocationUpdate}
                className="mt-2"
              />
            </View>

            <View className="mt-8">
              <CustomButton
                title="Sign Out"
                onPress={handleSignOut}
                bgVariant="danger"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Settings;
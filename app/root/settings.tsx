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
  ActivityIndicator,
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
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const { stateVars, setStateVars } = useNavigationContext();
  const [profileUser, setProfileUser] = useState<UserProfileType | null>(null);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`);
      const data = response.data[0];
      setProfileUser(data);
      setUsername(data.username || "");
      setEmail(data.email || "");
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      Alert.alert("Error", "Failed to load user data. Please try again later.");
    } finally {
      setLoading(false);
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
    if (!newUsername) {
      Alert.alert("Error", "Please enter a new username");
      return;
    }
    
    if (!verifyValidUsername(newUsername)) {
      Alert.alert(
        "Invalid Username",
        "Username can only contain alphanumeric characters, '_', '-', and '.' and must be at most 20 characters long"
      );
      return;
    }

    setUsernameLoading(true);
    try {
      const response = await fetchAPI("/api/users/patchUserInfo", {
        method: "PATCH",
        body: JSON.stringify({
          clerkId: user!.id,
          username: newUsername,
        }),
      });

      if (response.error) {
        if (response.error.includes("already taken")) {
          Alert.alert(
            "Username taken",
            `Username ${newUsername} already exists. Please try another one.`
          );
        } else {
          throw new Error(response.error);
        }
      } else {
        Alert.alert("Success", "Username updated successfully");
        await fetchUserData(); // Refresh all user data
        setNewUsername(""); // Clear input field
      }
    } catch (error) {
      console.error("Failed to update username:", error);
      Alert.alert("Error", "Failed to update username. Please try again.");
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleEmailUpdate = async () => {
    if (!newEmail) {
      Alert.alert("Error", "Please enter a new email");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }
    
    setEmailLoading(true);
    try {
      const response = await fetchAPI("/api/users/patchUserInfo", {
        method: "PATCH",
        body: JSON.stringify({
          clerkId: user!.id,
          email: newEmail,
        }),
      });
  
      if (response.error) {
        if (response.error.includes("already taken")) {
          Alert.alert(
            "Email taken",
            `Email ${newEmail} already exists. Please try another one.`
          );
        } else {
          throw new Error(response.error);
        }
      } else {
        Alert.alert("Success", "Email updated successfully");
        await fetchUserData();
        setNewEmail("");
      }
    } catch (error) {
      console.error("Failed to update email:", error);
      Alert.alert("Error", "Failed to update email. Please try again.");
    } finally {
      setEmailLoading(false);
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 font-Jakarta">Loading settings...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView className="flex-1">
          {/* Header */}
          <View className="flex flex-row items-center px-4 pt-2">
            <TouchableOpacity
              onPress={() => router.push("/root/tabs/profile")}
              className="mr-2"
            >
              <AntDesign name="caretleft" size={18} />
            </TouchableOpacity>
            <Text className="font-JakartaBold text-2xl">Settings</Text>
          </View>
          
          {/* Main Content */}
          <View className="m-4">
            <Text className="ml-2 text-xl font-JakartaSemiBold mb-4">
              Account
            </Text>
            
            <View className="bg-[#fafafa] rounded-[32px] p-5">
              {/* Username Section */}
              <View className="mb-4">
                <View className="flex flex-row items-center justify-between p-2">
                  <Text className="text-lg font-JakartaSemiBold">Username</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleUsernameUpdate}
                    disabled={usernameLoading || !newUsername}
                    className={`px-4 py-2 rounded-full ${
                      !newUsername ? "opacity-50" : ""
                    }`}
                  >
                    {usernameLoading ? (
                      <ActivityIndicator size="small" color="#4F46E5" />
                    ) : (
                      <Text className="text-md text-indigo-700 font-JakartaSemiBold">
                        Update
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
                <InputField
                  label=""
                  value={newUsername}
                  onChangeText={setNewUsername}
                  placeholder={username || "Enter username"}
                  containerStyle="mt-[0px]"
                  labelStyle="hidden" 
                />
              </View>
              
              {/* Email Section */}
              <View className="mb-4"> 
                <View className="flex flex-row items-center justify-between p-2">
                  <Text className="text-lg font-JakartaSemiBold">
                    Email Address
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleEmailUpdate}
                    disabled={emailLoading || !newEmail}
                    className={`px-4 py-2 rounded-full ${
                      !newEmail ? "opacity-50" : ""
                    }`}
                  >
                    {emailLoading ? (
                      <ActivityIndicator size="small" color="#4F46E5" />
                    ) : (
                      <Text className="text-md text-indigo-700 font-JakartaSemiBold">
                        Update
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
                <InputField
                  label=""
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder={profileUser?.email || "Enter email address"}
                  containerStyle="mt-[0px]" 
                  labelStyle="hidden"
              
                />
              </View>
              
              {/* Location Section */}
              <View className="mb-4 mx-2">
                <View className="flex flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-JakartaSemiBold">
                    Location
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleLocationUpdate}
                    className="px-4 py-2 rounded-full"
                  >
                    <Text className="text-md text-indigo-700 font-JakartaSemiBold">
                      Update
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-gray-500 mb-2">
                  {currentLocation}
                </Text>
              </View>
            </View>

            {/* Sign Out Button */}
            <View className="my-[36px]">
              <TouchableOpacity 
                onPress={handleSignOut}
                className="py-3 rounded-full"
                activeOpacity={0.7}
              >
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
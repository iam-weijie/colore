// Need to configure Email Verification & Update

import InputField from "@/components/InputField";
import { useNavigationContext } from "@/components/NavigationContext";
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { UserProfileType } from "@/types/type";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Switch, // Import Switch
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalContext } from "@/app/globalcontext"; // Import Global Context
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects"; // Import sound hook
import { useAlert } from '@/notifications/AlertContext';

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
  const [savedPosts, setSavedPosts] = useState<string[]>();
  const [likedPosts, setLikedPosts] = useState<string[]>();

  // Get settings state and setters from Global Context
  const {
    hapticsEnabled,
    setHapticsEnabled,
    soundEffectsEnabled,
    setSoundEffectsEnabled,
  } = useGlobalContext();
  const { playSoundEffect } = useSoundEffects(); // Use the sound hook
  const { showAlert } = useAlert();

  const fetchUserData = async () => {
    try {
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`);
      const data = response.data[0];
      setProfileUser(data);
      setUsername(data.username || "");
      setEmail(data.email || "");
      setSavedPosts(data.saved_posts);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`);
      const data = response.data[0];
      setSavedPosts(data.saved_posts);
    } catch (error) {
      console.error("Failed to fetch saved post data:", error);
    }
  };

  const fetchLikedPosts = async () => {
    try {
      const response = await fetchAPI(
        `/api/posts/getLikedPostsIds?userId=${user!.id}`
      );
      const data = response.data;
      setLikedPosts(data);
    } catch (error) {
      console.error("Failed to fetch liked post data:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchLikedPosts();
  }, []);

  const verifyValidUsername = (username: string): boolean => {
    const usernameRegex = /^[\w\-\.]{1,20}$/;
    return usernameRegex.test(username);
  };

  const handleUsernameUpdate = async () => {
    if (!verifyValidUsername(newUsername)) {
      showAlert({
        title: 'Invalid Username',
        message: `Username can only contain alphanumeric characters, '_', '-', and '.' and must be at most 20 characters long`,
        type: 'ERROR',
        status: 'error',
      });
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

      //console.log("Changed Username", response)
      if (response.error) {
        if (response.error.includes("already taken")) {

      showAlert({
        title: 'Username taken',
        message: `Username ${username} already exists. Please try another one.`,
        type: 'ERROR',
        status: 'error',
      });
        } else {
          throw new Error(response.error);
        }
      } else {
        showAlert({
          title: 'New Username',
          message: `Username updated successfully to ${newUsername}.`,
          type: 'UPDATE',
          status: 'success',
        });
        await fetchUserData();
      }
    } catch (error) {
      console.error("Failed to update username:", error);
      showAlert({
        title: 'Error',
        message: `Failed to update username. Please try again.`,
        type: 'ERROR',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const handleEmailUpdate = async () => {
    if (!newEmail || newEmail === email) {
      return;
    }

    if (!verifyValidEmail(newEmail)) {
      showAlert({
        title: 'Email address is invalid. ',
        message: `Please enter a valid email address.`,
        type: 'ERROR',
        status: 'error',
      });
      return;
    }
    setLoading(true);
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
          showAlert({
            title: 'Email taken',
            message: `Email ${newEmail} already exists. Please try another one.`,
            type: 'ERROR',
            status: 'error',
          });
        } else {
          throw new Error(response.error);
        }
      } else {
        showAlert({
          title: 'Success',
          message: `Email updated successfully to ${newEmail}.`,
          type: 'UPDATE',
          status: 'success',
        });
        await fetchUserData();
      }
    } catch (error) {
      console.error("Failed to update email:", error);
      showAlert({
        title: 'Error',
        message: `Failed to update email. Please try again.`,
        type: 'ERROR',
        status: 'error',
      });
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
      setLoading(true);
      router.replace("/auth/log-in");
    } catch (error) {
      console.error("Error signing out:", error);
      showAlert({
        title: 'Error',
        message: `Failed to sign out.`,
        type: 'ERROR',
        status: 'error',
      });
    }
  };

  const currentLocation = profileUser
    ? `${profileUser.city}, ${profileUser.state}, ${profileUser.country}`
    : "No location set";

  useFocusEffect(
    useCallback(() => {
      // Fetch all user data including location when screen is focused
      fetchUserData();
      fetchSavedPosts();
      fetchLikedPosts();
    }, [stateVars]) // Add back the dependency array for useCallback
  ); // Correctly close useFocusEffect

  // Define handlers outside of useEffect
  const handleHapticsToggle = (value: boolean) => {
    setHapticsEnabled(value);
    playSoundEffect(value ? SoundType.ToggleOn : SoundType.ToggleOff); // Play sound on toggle
  };

  const handleSoundToggle = (value: boolean) => {
    setSoundEffectsEnabled(value);
    playSoundEffect(value ? SoundType.ToggleOn : SoundType.ToggleOff); // Play sound on toggle
  };
  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-gray-50">
    <ScrollView className="flex-1 pt-6" showsVerticalScrollIndicator={false}>
      {/* Account Section */}
      <View className="mx-6 mb-6">
        <View 
          className="flex-1 p-4 rounded-[48px] overflow-hidden shadow-sm border-4" 
          style={{
            backgroundColor: "#93c5fd",
            borderColor: "#ffffff80",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
          }}
        >
          <View className="px-5 py-3">
            <Text className="text-lg font-JakartaBold text-gray-800">Account Information</Text>
          </View>
          
          <View className="px-5 py-3">
            <Text className="text-sm font-JakartaSemiBold text-[#000]">Username</Text>
            <InputField
              label=""
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder={username || "Enter username"}
              onSubmitEditing={() => {
                if (!newUsername || loading) return;
                handleUsernameUpdate();
                setUsername(newUsername);
                setNewUsername("");
              }}
              containerStyle="-mt-8"
            />
          </View>
          
          <View className="px-5 py-3">
            <Text className="text-sm font-JakartaSemiBold text-[#000]">Email Address</Text>
            <InputField
              label=""
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder={profileUser?.email || "Enter email address"}
              onSubmitEditing={() => {
                if (!newEmail || loading) return;
                handleEmailUpdate();
                setEmail(newEmail);
                setNewEmail("");
              }}
              containerStyle="-mt-8"
            />
          </View>
          
          <View className="px-5 py-3">
            <View className="flex flex-row items-center justify-between mb-1">
              <Text className="text-sm font-JakartaSemiBold text-[#000]">Location</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleLocationUpdate}
                className="bg-blue-50 px-3 py-1 rounded-full"
              >
                <Text className="text-[#93c5fd] text-sm font-JakartaSemiBold">Update</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-gray-800 mt-1">{currentLocation || "Not specified"}</Text>
          </View>
        </View>
      </View>
  
      {/* Activity Section */}
      <View className="mx-6 mb-6">
        <View 
          className="flex-1 p-4 rounded-[48px] overflow-hidden shadow-sm border-4" 
          style={{
            backgroundColor: "#CFB1FB",
            borderColor: "#ffffff80",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
          }}
        >
          <View className="px-5 py-4">
            <Text className="text-lg font-JakartaBold text-gray-800">Your Activity</Text>
          </View>
          
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              router.push({
                pathname: "/root/saved-post-gallery",
                params: {
                  posts: JSON.stringify(savedPosts),
                  name: "Saved Posts",
                },
              });
            }}
            className="px-5 py-4 flex flex-row items-center justify-between"
          >
            <View className="flex flex-row items-center">
              <View className="bg-black p-2 rounded-xl mr-3">
                <Image
                  source={icons.bookmark}
                  tintColor="#ffffff"
                  resizeMode="contain"
                  className="w-5 h-5"
                />
              </View>
              <Text className="text-base font-JakartaSemiBold text-gray-800">Saved Posts</Text>
            </View>
            <View className="flex flex-row items-center">
              <Text className="text-[#000] text-sm mr-2">{savedPosts?.length || 0}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              router.push({
                pathname: "/root/saved-post-gallery",
                params: {
                  posts: JSON.stringify(likedPosts),
                  name: "Liked Posts",
                },
              });
            }}
            className="px-5 py-4 flex flex-row items-center justify-between"
          >
            <View className="flex flex-row items-center">
              <View className="bg-red-50 p-2 rounded-xl mr-3">
                <MaterialCommunityIcons
                  name="heart-outline"
                  size={20}
                  color="#EF4444"
                />
              </View>
              <Text className="text-base font-JakartaSemiBold text-gray-800">Liked Posts</Text>
            </View>
            <View className="flex flex-row items-center">
              <Text className="text-[#000] text-sm mr-2">{likedPosts?.length || 0}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
  
      {/* Preferences Section */}
      <View className="mx-6 mb-6">
        <View 
          className="flex-1 p-4 rounded-[48px] overflow-hidden shadow-sm border-4" 
          style={{
            backgroundColor: "#ffe640",
            borderColor: "#ffffff80",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
          }}
        >
          <View className="px-5 py-4">
            <Text className="text-lg font-JakartaBold text-gray-800">Preferences</Text>
          </View>
          
          <View className="px-5 py-3 flex flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-JakartaSemiBold text-gray-800 mb-1">Haptic Feedback</Text>
              <Text className="text-sm text-gray-800">Get physical feedback for interactions</Text>
            </View>
            <Switch
              trackColor={{ false: "#888", true: "#000" }}
              thumbColor={hapticsEnabled ? "#ffffff" : "#f4f3f4"}
              ios_backgroundColor="#E5E7EB"
              onValueChange={handleHapticsToggle}
              value={hapticsEnabled}
            />
          </View>
          
          <View className="px-5 py-3 flex flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-JakartaSemiBold text-gray-800 mb-1">Sound Effects</Text>
              <Text className="text-sm text-gray-800">Play sounds for certain actions</Text>
            </View>
            <Switch
              trackColor={{ false: "#888", true: "#000" }}
              thumbColor={soundEffectsEnabled ? "#ffffff" : "#f4f3f4"}
              ios_backgroundColor="#E5E7EB"
              onValueChange={handleSoundToggle}
              value={soundEffectsEnabled}
            />
          </View>
        </View>
      </View>
  
      {/* Sign Out Section */}
      <View className="mx-6 mb-8">
        <TouchableOpacity 
          onPress={handleSignOut}
          className="bg-white rounded-[32px] p-4 shadow-sm overflow-hidden flex items-center justify-center"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}
        >
          <Text className="font-JakartaBold text-lg text-red-500">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
  );
};

export default Settings;

/*

                    console.log("Pressed")
                   if (!newUsername || loading) {
                      return;
                    }
                    handleUsernameUpdate();
                    setUsername(newUsername)
                    setNewUsername("");

                  }}
                    */

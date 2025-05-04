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
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <View className="flex flex-row items-center px-4 pt-2">
          <View>
            <TouchableOpacity onPress={() => router.back()} className="mr-2">
              <AntDesign name="caretleft" size={18} />
            </TouchableOpacity>
          </View>
          <View>
            <Text className="font-JakartaBold text-2xl">Settings</Text>
          </View>
        </View>
        <ScrollView className="flex-1">
          <View className=" mx-6">
            <Text className="text-xl font-JakartaBold my-4 bg-[#93c5fd] text-[#ffffff] rounded-[24px] px-5 py-6">
              Account
            </Text>
            <View className="bg-[#fafafa] rounded-[32px] p-5">
              <View className="flex flex-row items-center justify-between -mb-14 p-2">
                <Text className="text-lg font-JakartaSemiBold my-2">
                  Username
                </Text>
              </View>
              <InputField
                label=""
                value={newUsername}
                onChangeText={setNewUsername}
                placeholder={username || "Enter username"}
                onSubmitEditing={() => {
                  if (!newUsername || loading) {
                    return;
                  }
                  handleUsernameUpdate();
                  setUsername(newUsername);
                  setNewUsername("");
                }}
              />
              <View className="flex flex-row items-center justify-between -mb-14 p-2">
                <Text className="text-lg font-JakartaSemiBold mb-2">
                  Email Address
                </Text>
              </View>
              <InputField
                label=""
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder={profileUser?.email || "Enter email address"}
                onSubmitEditing={() => {
                  if (!newEmail || loading) {
                    return;
                  }
                  handleEmailUpdate();
                  setEmail(newEmail);
                  setNewEmail("");
                }}
                containerStyle="mb-4"
              />
              <View className="mb-4 mx-2 pr-[20px]">
                <View className="flex flex-row items-center justify-between mb-4">
                  <Text className="text-lg  font-JakartaSemiBold ">
                    Location
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.5}
                    onPress={handleLocationUpdate}
                  >
                    <Text className="text-md text-[#93c5fd] font-JakartaSemiBold">
                      Update
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text className="text-gray-500 mb-2">{currentLocation}</Text>
              </View>
            </View>
          </View>
          <View className=" mx-6">
            <Text className=" text-xl font-JakartaBold my-4 bg-[#CFB1FB] text-[#ffffff]  rounded-[24px] px-5 py-6">
              Activity
            </Text>
            <View className="bg-[#fafafa] rounded-[32px] p-5">
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => {
                  router.push({
                    pathname: "/root/saved-post-gallery",
                    params: {
                      posts: JSON.stringify(savedPosts),
                      name: "Saved Posts",
                    },
                  });
                }}
              >
                <View className="flex flex-row items-center justify-between p-2">
                  <View>
                    <Text className="text-lg font-JakartaSemiBold my-2">
                      Saved Posts
                    </Text>
                  </View>
                  <View className="flex flex-row items-center">
                    <Text className="text-gray-400 text-sm mr-2">
                      {savedPosts?.length || ""}
                    </Text>
                    <Image
                      source={icons.bookmark}
                      tintColor="#000000"
                      resizeMode="contain"
                      className="w-6 h-6"
                    />
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => {
                  router.push({
                    pathname: "/root/saved-post-gallery",
                    params: {
                      posts: JSON.stringify(likedPosts),
                      name: "Liked Posts",
                    },
                  });
                }}
              >
                <View className="flex flex-row items-center justify-between p-2">
                  <View>
                    <Text className="text-lg font-JakartaSemiBold my-2">
                      Liked Posts
                    </Text>
                  </View>
                  <View className="flex flex-row items-center">
                    <Text className="text-gray-400 text-sm mr-2">
                      {likedPosts?.length || ""}
                    </Text>
                    <MaterialCommunityIcons
                      name={"heart-outline"}
                      size={24}
                      color={"black"}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          {/* End Activity Section View */}

          {/* --- New Audio & Haptics Section --- */}
          <View className=" mx-6">
             <Text className=" text-xl font-JakartaBold my-4 bg-[#FACC15] text-[#ffffff] rounded-[24px] px-5 py-6">
               Audio & Haptics
             </Text>
             <View className="bg-[#fafafa] rounded-[32px] p-5">
               {/* Haptics Toggle */}
               <View className="flex flex-row items-center justify-between p-2 mb-2">
                 <Text className="text-lg font-JakartaSemiBold">Enable Haptic Feedback</Text>
                 <Switch
                   trackColor={{ false: "#767577", true: "#FACC15" }}
                   thumbColor={hapticsEnabled ? "#ffffff" : "#f4f3f4"}
                   ios_backgroundColor="#888888"
                   onValueChange={handleHapticsToggle} // Use wrapped handler
                   value={hapticsEnabled}
                 />
               </View>
               {/* Sound Effects Toggle */}
               <View className="flex flex-row items-center justify-between p-2">
                 <Text className="text-lg font-JakartaSemiBold">Enable Sound Effects</Text>
                 <Switch
                   trackColor={{ false: "#767577", true: "#FACC15" }}
                   thumbColor={soundEffectsEnabled ? "#ffffff" : "#f4f3f4"}
                   ios_backgroundColor="#888888"
                   onValueChange={handleSoundToggle} // Use wrapped handler
                   value={soundEffectsEnabled}
                 />
               </View>
             </View>
           </View>
           {/* --- End New Section --- */}


          <View className="my-[36px]">
            <TouchableOpacity onPress={handleSignOut}>
              <Text className="font-JakartaBold text-xl text-red-500 text-center">
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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

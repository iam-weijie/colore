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
import { useAlert } from "@/notifications/AlertContext";
import ModalSheet from "@/components/Modal";
import RenameContainer from "@/components/RenameContainer";
import { Modal as RNModal } from "react-native";


const Settings = () => {


  const { signOut } = useAuth();
  const { user } = useUser();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { stateVars, setStateVars } = useNavigationContext();
  const [selectedModal, setSelectedModal] = useState<any>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [profileUser, setProfileUser] = useState<UserProfileType | null>(null);
  const [savedPosts, setSavedPosts] = useState<string[]>();
  const [likedPosts, setLikedPosts] = useState<string[]>();
  const [libraryVisible, setLibraryVisible] = useState(false);
  const [colorLibrary, setColorLibrary] = useState<{ name: string; meaning: string; SRB: number[] }[]>([]);
  const blueProgress = Math.min(100, Math.floor((savedPosts?.length || 0) / 3) * 20);
  const yellowProgress = Math.min(100, Math.floor((likedPosts?.length || 0) / 10) * 20);
  const pinkProgress = Math.min(
    100,
    Math.floor((profileUser?.customizations?.length || 0) / 5) * 20
  );
  const [unlockedColors, setUnlockedColors] = useState<{ name: string; meaning: string; SRB: number[] }[]>([]);
  const handleAttemptColorCreation = () => {
    const S = Math.floor((savedPosts?.length || 0) / 3);
    const R = Math.floor((likedPosts?.length || 0) / 10);
    const B = Math.floor((profileUser?.customizations?.length || 0) / 5);
    const userSRB = [S, R, B];
  
    const matchedColor = colorLibrary.find(
      (c) =>
        c.SRB[0] === userSRB[0] &&
        c.SRB[1] === userSRB[1] &&
        c.SRB[2] === userSRB[2]
    );

    if (matchedColor) {
      const alreadyUnlocked = unlockedColors.some(
        (uc) => uc.name === matchedColor.name
      );
  
      if (!alreadyUnlocked) {
        setUnlockedColors((prev) => [...prev, matchedColor]);
  
        showAlert({
          title: "🎉 Color Unlocked!",
          message: `${matchedColor.name} has been added to your collection.`,
          type: "UPDATE",
          status: "success",
        });
      } else {
        showAlert({
          title: "Already Unlocked",
          message: `You already have ${matchedColor.name}.`,
          type: "INFO",
          status: "info",
        });
      }
    } else {
      showAlert({
        title: "No Match",
        message: "Your current SRB doesn't match any color. Try again later!",
        type: "ERROR",
        status: "error",
      });
    }
  };

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
    setColorLibrary([
      { name: "Blue", meaning: "Peace and Calm | Saved posts", SRB: [3, 2, 1] },
      { name: "Yellow", meaning: "Energy and Joy | Liked posts", SRB: [1, 3, 2] },
      { name: "Pink", meaning: "Love and Creativity | Customizations", SRB: [2, 1, 3] },
    ]);
  }, []);

  const verifyValidUsername = (username: string): boolean => {
    const usernameRegex = /^[\w\-\.]{1,20}$/;
    return usernameRegex.test(username);
  };

  const handleUsernameUpdate = async (newName: string) => {
    console.log("New Username: ", newName);
    if (!verifyValidUsername(newName)) {
      showAlert({
        title: "Invalid Username",
        message: `Username can only contain alphanumeric characters, '_', '-', and '.' and must be at most 20 characters long`,
        type: "ERROR",
        status: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetchAPI("/api/users/patchUserInfo", {
        method: "PATCH",
        body: JSON.stringify({
          clerkId: user!.id,
          username: newName,
        }),
      });

      //console.log("Changed Username", response)
      if (response.error) {
        if (response.error.includes("already taken")) {
          showAlert({
            title: "Username taken",
            message: `Username ${newName} already exists. Please try another one.`,
            type: "ERROR",
            status: "error",
          });
        } else {
          throw new Error(response.error);
        }
      } else {
        showAlert({
          title: "New Username",
          message: `Username updated successfully to ${newName}.`,
          type: "UPDATE",
          status: "success",
        });
        await fetchUserData();
      }
    } catch (error) {
      console.error("Failed to update username:", error);
      showAlert({
        title: "Error",
        message: `Failed to update username. Please try again.`,
        type: "ERROR",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const handleEmailUpdate = async (newEmail: string) => {
    if (!newEmail || newEmail === email) {
      return;
    }

    if (!verifyValidEmail(newEmail)) {
      showAlert({
        title: "Email address is invalid. ",
        message: `Please enter a valid email address.`,
        type: "ERROR",
        status: "error",
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
            title: "Email taken",
            message: `Email ${newEmail} already exists. Please try another one.`,
            type: "ERROR",
            status: "error",
          });
        } else {
          throw new Error(response.error);
        }
      } else {
        showAlert({
          title: "Success",
          message: `Email updated successfully to ${newEmail}.`,
          type: "UPDATE",
          status: "success",
        });
        await fetchUserData();
      }
    } catch (error) {
      console.error("Failed to update email:", error);
      showAlert({
        title: "Error",
        message: `Failed to update email. Please try again.`,
        type: "ERROR",
        status: "error",
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
      router.replace("/auth/onboarding");
    } catch (error) {
      console.error("Error signing out:", error);
      showAlert({
        title: "Error",
        message: `Failed to sign out.`,
        type: "ERROR",
        status: "error",
      });
    }
  };

  const handleUpdateValue = (type: string) => {
    setSelectedTitle(`${type == "username" ? "New username" : "New Email"}`);
    setSelectedModal(
      <RenameContainer
        initialValue={""}
        onSave={(newName: string) => {
          if (type === "username") {
            handleUsernameUpdate(newName);
          } else {
            handleEmailUpdate(newName);
          }

          setSelectedModal(null);
          setSelectedTitle("");
        }}
        onCancel={() => {
          setSelectedModal(null);
          setSelectedTitle("");
        }}
        placeholder={type === "username" ? username : email}
        maxCharacters={type === "username" ? 20 : 50}
      />
    );
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
            <Text className="text-lg font-JakartaBold text-gray-800">
              Account Information
            </Text>
          </View>
          {/*
          
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
          </View>*/}

          {/*<View className="px-5 py-3">
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
          </View>*/}
          <View className="px-5 py-3">
            <View className="flex flex-row items-center justify-between mb-1">
              <Text className="text-lg font-JakartaSemiBold text-[#000]">
                Username
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleUpdateValue("username")}
                className="bg-black px-3 py-2 rounded-full"
              >
                <Text className="text-[#93c5fd] text-sm font-JakartaSemiBold">
                  Update
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-gray-800 text-base font-JakartaMedium mt-1">
              {username || "Not specified"}
            </Text>
          </View>
          <View className="px-5 py-3">
            <View className="flex flex-row items-center justify-between mb-1">
              <Text className="text-lg font-JakartaSemiBold text-[#000]">
                Email
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleUpdateValue("email")}
                className="bg-black px-3 py-2 rounded-full"
              >
                <Text className="text-[#93c5fd] text-sm font-JakartaSemiBold">
                  Update
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-gray-800 text-base font-JakartaMedium mt-1">
              {email || "Not specified"}
            </Text>
          </View>

          <View className="px-5 py-3">
            <View className="flex flex-row items-center justify-between mb-1">
              <Text className="text-lg font-JakartaSemiBold text-[#000]">
                Location
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleLocationUpdate}
                className="bg-black px-3 py-2 rounded-full"
              >
                <Text className="text-[#93c5fd] text-sm font-JakartaSemiBold">
                  Update
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-gray-800 text-base font-JakartaMedium  mt-1">
              {currentLocation || "Not specified"}
            </Text>
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
            <Text className="text-lg font-JakartaBold text-gray-800">
              Your Activity
            </Text>
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
              <Text className="text-base font-JakartaSemiBold text-gray-800">
                Saved Posts
              </Text>
            </View>
            <View className="flex flex-row items-center">
              <Text className="text-[#000] text-sm mr-2">
                {savedPosts?.length || 0}
              </Text>
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
              <View className="bg-black p-2 rounded-xl mr-3">
                <MaterialCommunityIcons
                  name="heart-outline"
                  size={20}
                  color="#EF4444"
                />
              </View>
              <Text className="text-base font-JakartaSemiBold text-gray-800">
                Liked Posts
              </Text>
            </View>
            <View className="flex flex-row items-center">
              <Text className="text-[#000] text-sm mr-2">
                {likedPosts?.length || 0}
              </Text>
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
            <Text className="text-lg font-JakartaBold text-gray-800">
              Preferences
            </Text>
          </View>

          <View className="px-5 py-3 flex flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-JakartaSemiBold text-gray-800 mb-1">
                Haptic Feedback
              </Text>
              <Text className="text-sm text-gray-800">
                Get physical feedback for interactions
              </Text>
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
              <Text className="text-base font-JakartaSemiBold text-gray-800 mb-1">
                Sound Effects
              </Text>
              <Text className="text-sm text-gray-800">
                Play sounds for certain actions
              </Text>
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

      {/* Colors Section */}
      <View className="mx-6 mb-6">
        <View
          className="flex-1 p-4 rounded-[48px] overflow-hidden shadow-sm border-4"
          style={{
            backgroundColor: "#fdf6e3",
            borderColor: "#ffffff80",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
          }}
        >
          <View className="px-5 py-3">
            <Text className="text-lg font-JakartaBold text-gray-800">
              Colors
            </Text>
          </View>

          <View className="px-5 py-4">
            <TouchableOpacity
              onPress={() => setLibraryVisible(true)}
              className="bg-black px-4 py-3 rounded-full items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white text-sm font-JakartaSemiBold">
                🎨 View Color Library
              </Text>
            </TouchableOpacity>
          </View>

          <View className="px-5 py-2">
            <TouchableOpacity
              onPress={handleAttemptColorCreation}
              className="bg-yellow-500 px-4 py-3 rounded-full items-center"
              activeOpacity={0.8}
            >
              <Text className="text-black text-sm font-JakartaSemiBold">✨ Attempt Create Color</Text>
            </TouchableOpacity>
          </View>


          {/* Blue Progress */}
          <View className="px-5 py-2">
            <Text className="text-sm font-JakartaSemiBold text-gray-800 mb-1">
              🔵 Blue Level
            </Text>
            <View className="h-3 rounded-full bg-gray-300 overflow-hidden">
              <View
                style={{
                  width: `${Math.min(100, Math.floor((savedPosts?.length || 0) / 3) * 20)}%`,
                  backgroundColor: "#60a5fa", // Blue
                }}
                className="h-full rounded-full"
              />
            </View>
          </View>

          {/* Yellow Progress */}
          <View className="px-5 py-2">
            <Text className="text-sm font-JakartaSemiBold text-gray-800 mb-1">
              🟡 Yellow Level
            </Text>
            <View className="h-3 rounded-full bg-gray-300 overflow-hidden">
              <View
                style={{
                  width: `${Math.min(100, Math.floor((likedPosts?.length || 0) / 10) * 20)}%`,
                  backgroundColor: "#facc15", // Yellow
                }}
                className="h-full rounded-full"
              />
            </View>
          </View>

          {/* Pink Progress */}
          <View className="px-5 py-2">
            <Text className="text-sm font-JakartaSemiBold text-gray-800 mb-1">
              🩷 Pink Level
            </Text>
            <View className="h-3 rounded-full bg-gray-300 overflow-hidden">
              {/* Blue Progress */}
              <View className="h-3 rounded-full bg-gray-300 overflow-hidden">
                <View
                  style={{
                    width: `${blueProgress}%`,
                    backgroundColor: "#60a5fa",
                  }}
                  className="h-full rounded-full"
                />
              </View>

              {/* Yellow Progress */}
              <View className="h-3 rounded-full bg-gray-300 overflow-hidden">
                <View
                  style={{
                    width: `${yellowProgress}%`,
                    backgroundColor: "#facc15",
                  }}
                  className="h-full rounded-full"
                />
              </View>

              {/* Pink Progress */}
              <View className="h-3 rounded-full bg-gray-300 overflow-hidden">
                <View
                  style={{
                    width: `${pinkProgress}%`,
                    backgroundColor: "#f9a8d4",
                  }}
                  className="h-full rounded-full"
                />
              </View>

            </View>
          </View>
        </View>
      </View>

      {/* Sign Out Section */}
      <View className="mx-6 mb-6">
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
          <Text className="font-JakartaBold text-lg text-red-500">
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>

      {!!selectedModal && (
        <ModalSheet
          children={selectedModal}
          title={selectedTitle}
          isVisible={!!selectedModal}
          onClose={() => {
            setSelectedModal(null);
            setSelectedTitle("");
          }}
        />
      )}

  <RNModal visible={libraryVisible} animationType="slide">

        <SafeAreaView
          style={{ flex: 1, backgroundColor: "white", padding: 24 }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 16 }}>
            Your Color Library
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {colorLibrary.length === 0 ? (
              <Text style={{ fontSize: 16, color: "gray" }}>
                You haven’t collected any colors yet.
              </Text>
            ) : (
              colorLibrary.map((c, i) => (
                <View key={i} style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: "600" }}>
                    🎨 {c.name}
                  </Text>
                  <Text style={{ fontSize: 14, color: "gray" }}>
                    {c.meaning}
                  </Text>
                  <Text style={{ fontSize: 12 }}>SRB: {c.SRB.join(" - ")}</Text>
                </View>
              ))
            )}
          </ScrollView>
          <TouchableOpacity
            onPress={() => setLibraryVisible(false)}
            style={{
              marginTop: 24,
              backgroundColor: "#000",
              padding: 12,
              borderRadius: 999,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>Close</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </RNModal>
    </ScrollView>
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

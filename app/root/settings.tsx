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
import { useGlobalContext } from "@/app/globalcontext"; // Import Global Context
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects"; // Import sound hook
import { useAlert } from "@/notifications/AlertContext";
import ModalSheet from "@/components/Modal";
import RenameContainer from "@/components/RenameContainer";
import EmojiSettings from "@/components/EmojiSettings";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";

const Settings = () => {

    const {
    hapticsEnabled,
    setHapticsEnabled,
    soundEffectsEnabled,
    setSoundEffectsEnabled,
    profile,
    setProfile
  } = useGlobalContext();
  const { playSoundEffect } = useSoundEffects(); // Use the sound hook
  const { showAlert } = useAlert();


  const { signOut } = useAuth();
  const { user } = useUser();
  const [username, setUsername] = useState(profile?.username || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [loading, setLoading] = useState(false);
  const { stateVars, setStateVars } = useNavigationContext();
  const [selectedModal, setSelectedModal] = useState<any>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [profileUser, setProfileUser] = useState<UserProfileType | null>(profile);
  const [savedPosts, setSavedPosts] = useState<string[]>();
  const [likedPosts, setLikedPosts] = useState<string[]>();


  // Get settings state and setters from Global Context


  const fetchUserData = async () => {
    try {
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`);
      const data = response.data[0];
      setProfile(data);
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
    fetchLikedPosts();
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
    playSoundEffect(SoundType.Navigation)
    Haptics.selectionAsync();

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
      playSoundEffect(SoundType.Tap)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
    playSoundEffect(SoundType.Submit)
    Haptics.selectionAsync();

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

   <ScrollView 
   className="flex-1 pt-6 bg-gray-50" 
   showsVerticalScrollIndicator={false}
   contentContainerStyle={{ paddingBottom: 90 }}>
  {/* Header Card Component */}
  <View className="mx-6 mb-6">
    <HeaderCard 
      title="Account" 
      color="#93c5fd"
      content={
        <>
          <DetailRow 
            label="Username" 
            value={username} 
            onPress={() => handleUpdateValue("username")}
            accentColor="#93c5fd"
          />
          <DetailRow 
            label="Email" 
            value={email} 
            onPress={() => handleUpdateValue("email")}
            accentColor="#93c5fd"
          />
          <DetailRow 
            label="Location" 
            value={currentLocation} 
            onPress={handleLocationUpdate}
            accentColor="#93c5fd"
          />
        </>
      }
    />
  </View>

  {/* Activity Section */}
  <View className="mx-6 mb-6">
    <HeaderCard 
      title="Your Activity" 
      color="#CFB1FB"
      content={
        <>
          <ActionRow 
            icon={<Image source={icons.bookmark} tintColor="#000" resizeMode="contain" className="w-5 h-5" />}
            label="Saved Posts"
            count={savedPosts?.length || 0}
            onPress={() => router.push({
              pathname: "/root/saved-post-gallery",
              params: { posts: JSON.stringify(savedPosts), name: "Saved Posts" }
            })}
            accentColor="#CFB1FB"
          />
          <ActionRow 
            icon={<MaterialCommunityIcons name="heart-outline" size={20} color="#000" />}
            label="Liked Posts"
            count={likedPosts?.length || 0}
            onPress={() => router.push({
              pathname: "/root/saved-post-gallery",
              params: { posts: JSON.stringify(likedPosts), name: "Liked Posts" }
            })}
            accentColor="#CFB1FB"
          />
          <ActionRow
            icon={<AntDesign name="clockcircleo" size={20} color="#000" />}
            label="Quick Reaction Emojis"
            count={0} // Placeholder for future implementation
            onPress={() => {
              playSoundEffect(SoundType.Navigation);
              Haptics.selectionAsync();
              setSelectedTitle("Customize Emojis");
              setSelectedModal(
                <EmojiSettings
                  onClose={() => {
                    setSelectedModal(null);
                    setSelectedTitle("");
                  }}
                />
              );
            }}
            accentColor="#CFB1FB" />
        </>
      }
    />
  </View>

  {/* Preferences Section */}
  <View className="mx-6 mb-6">
    <HeaderCard 
      title="Preferences" 
      color="#ffe640"
      content={
        <>
          <ToggleRow 
            label="Haptic Feedback"
            description="Get physical feedback for interactions"
            value={hapticsEnabled}
            onValueChange={handleHapticsToggle}
            accentColor="#ffe640" // Dark gray from your shadows
          />
          <ToggleRow 
            label="Sound Effects"
            description="Play sounds for certain actions"
            value={soundEffectsEnabled}
            onValueChange={handleSoundToggle}
            accentColor="#ffe640"
          />
        </>
      }
    />
  </View>

  {/* Sign Out Button */}
  <View className="mx-6 mb-10">
    <TouchableOpacity 
      onPress={handleSignOut}
      activeOpacity={0.7}
      className="bg-white rounded-[32px] p-4 shadow-sm overflow-hidden flex items-center justify-center border-2 border-gray-100"
      style={{
        shadowColor: "#636363",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}
    >
      <Text className="font-JakartaBold text-lg text-red-500">Sign Out</Text>
    </TouchableOpacity>
  </View>

  {!!selectedModal && 
    <ModalSheet 
      children={selectedModal} 
      title={selectedTitle} 
      isVisible={!!selectedModal} 
      onClose={() => {
        setSelectedModal(null)
        setSelectedTitle("")
      }} 
    />
  }
</ScrollView>)
};


// Reusable Components
const HeaderCard = ({ title, color, content }) => (
  <View className="rounded-[48px] py-3"
    style={{
      backgroundColor: "#ffffff",
      borderColor: "#fafafa80",
      shadowColor: "#63636388",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
    }}>
    <View 
      className="px-4 py-2 rounded-[48px] w-[70%] ml-5 overflow-hidden shadow-sm border-2" 
      style={{
        backgroundColor: color,
        borderColor: "#ffffff80",
        shadowColor: "#636363",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      }}
    >
      <View className="px-5 py-2">
        <Text className="text-[18px] font-JakartaSemiBold text-white">{title}</Text>
      </View>
    </View>
    
    <View className="px-4 pb-4 rounded-[48px] overflow-hidden shadow-sm">
      {content}
    </View>
  </View>
);

const DetailRow = ({ label, value, onPress, accentColor }) => (
  <View className="px-5 py-3  last:border-b-0">
    <View className="flex flex-row items-center justify-between mb-1">
      <Text className="text-[16px] font-JakartaSemiBold text-gray-800">{label}</Text>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        className="px-3 py-2 rounded-full shadow-xs"
        style={{ backgroundColor: "#fff" }}
      >
        <Text className="text-sm font-JakartaSemiBold" style={{ color: accentColor }}>Update</Text>
      </TouchableOpacity>
    </View>
    <Text className="text-gray-800 text-[14px] font-JakartaMedium">
      {value || "Not specified"}
    </Text>
  </View>
);

const ActionRow = ({ icon, label, count, onPress, accentColor }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    className="px-5 py-4 flex flex-row items-center justify-between "
  >
    <View className="flex flex-row items-center">
      <View className="p-2 rounded-xl mr-3" style={{ backgroundColor: "#fafafa" }}>
        {icon}
      </View>
      <Text className="text-[14px] font-JakartaSemiBold text-gray-800">{label}</Text>
    </View>
    <View className="flex flex-row items-center">
      <Text className="text-gray-600 text-sm mr-2">{count}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
    </View>
  </TouchableOpacity>
);

const ToggleRow = ({ label, description, value, onValueChange, accentColor }) => (
  <View className="px-5 py-3 flex flex-row items-center justify-between last:border-b-0">
    <View className="flex-1">
      <Text className="text-[16px] font-JakartaSemiBold text-gray-800 mb-1">{label}</Text>
      <Text className="text-[14px] text-gray-800">{description}</Text>
    </View>
    <Switch
      trackColor={{ false: "#fafafa", true: accentColor }}
      thumbColor={value ? "#ffffff" : "#f4f3f4"}
      ios_backgroundColor="#E5E7EB"
      onValueChange={onValueChange}
      value={value}
    />
  </View>
);


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

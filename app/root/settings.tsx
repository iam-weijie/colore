// Need to configure Email Verification & Update
import { useNavigationContext } from "@/components/NavigationContext";
import { icons } from "@/constants";
import { allColors } from "@/constants/colors";
import { fetchAPI } from "@/lib/fetch";
import { PostItColor, UserProfileType } from "@/types/type";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useGlobalContext } from "@/app/globalcontext"; // Import Global Context
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects"; // Import sound hook
import { useAlert } from "@/notifications/AlertContext";
import ModalSheet from "@/components/Modal";
import RenameContainer from "@/components/RenameContainer";
import CustomButton from "@/components/CustomButton";
import ItemContainer from "@/components/ItemContainer";
import ProgressBar from "@/components/ProgressBar";
import EmojiSettings from "@/components/EmojiSettings";
import {
  HeaderCard,
  DetailRow,
  ActionRow,
  ToggleRow,
} from "@/components/CardInfo";
import KeyboardOverlay from "@/components/KeyboardOverlay";
import { SRBInfoPage, InformationInfoPage, YourActivityInfoPage, PreferencesInfoPage } from "@/components/InfoView";
import { encryptionCache } from "@/cache/encryptionCache";

const Settings = () => {
  const {
    hapticsEnabled,
    setHapticsEnabled,
    soundEffectsEnabled,
    setSoundEffectsEnabled,
    profile,
    setProfile,
    refreshProfile,
    userColors,
    setEncryptionKey,
  } = useGlobalContext();
  const { playSoundEffect } = useSoundEffects(); // Use the sound hook
  const { showAlert } = useAlert();

  const { signOut } = useAuth();
  const { user } = useUser();
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const [username, setUsername] = useState(profile?.username || "");
  const [nickname, setNickname] = useState(profile?.nickname || "");
  const [incognitoName, setIncognitoName] = useState(
    profile?.incognito_name || ""
  );
  const [email, setEmail] = useState(profile?.email || "");
  const [loading, setLoading] = useState(false);
  const { stateVars, setStateVars } = useNavigationContext();
  const [selectedModal, setSelectedModal] = useState<any>(null);
  const [type, setUpdateType] = useState<string>("");
  const [onFocus, setOnFocus] = useState<boolean>(false);
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [profileUser, setProfileUser] = useState<UserProfileType | null>(
    profile || null
  );
  const [savedPosts, setSavedPosts] = useState<string[]>();
  const [likedPosts, setLikedPosts] = useState<string[]>();
  const [libraryVisible, setLibraryVisible] = useState(false);
  const [colorLibrary, setColorLibrary] = useState<PostItColor[]>(
    userColors || allColors
  );
  const blueProgress = useMemo(
    () => Math.min(100, Math.floor((savedPosts?.length || 0) / 3) * 20),
    [savedPosts]
  );
  const yellowProgress = useMemo(
    () => Math.min(100, Math.floor((likedPosts?.length || 0) / 10) * 20),
    []
  );
  const pinkProgress = useMemo(
    () =>
      Math.min(
        100,
        Math.floor((profileUser?.customizations?.length || 0) / 5) * 20
      ),
    []
  );
  const [unlockedColors, setUnlockedColors] = useState<PostItColor[]>([]);
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
        (uc) => uc.id === matchedColor.name
      );

      if (!alreadyUnlocked) {
        setUnlockedColors((prev) => [...prev, matchedColor]);

        showAlert({
          title: "🎉 Color Unlocked!",
          message: `${matchedColor.name} has been added to your collection.`,
          type: "UPDATE",
          status: "success"
        });
      } else {
        showAlert({
          title: "Already Unlocked",
          message: `You already have ${matchedColor.name}.`,
          type: "UPDATE",
          status: "warning",
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

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setNickname(profile.nickname || "");
      setIncognitoName(profile.incognito_name || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  const verifyValidName = (username: string): boolean => {
    const usernameRegex = /^[\w\-\.]{1,20}$/;
    return usernameRegex.test(username);
  };

  const handleUsernameUpdate = async (newName: string) => {
    console.log("New Username: ", newName);
    if (!verifyValidName(newName)) {
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
      const response = await fetchAPI("/api/users/updateUserInfo", {
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

  const handleNicknameUpdate = async (newName: string) => {
    console.log("New Nickname: ", newName);
    if (!verifyValidName(newName)) {
      showAlert({
        title: "Invalid Nickname",
        message: `Nickname can only contain alphanumeric characters, '_', '-', and '.' and must be at most 20 characters long`,
        type: "ERROR",
        status: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetchAPI("/api/users/updateUserInfo", {
        method: "PATCH",
        body: JSON.stringify({
          clerkId: user!.id,
          nickname: newName,
        }),
      });

      //console.log("Changed Nickname", response)
      if (response.error) {
        throw new Error(response.error);
      } else {
        showAlert({
          title: "New Nickname",
          message: `Nickname updated successfully to ${newName}.`,
          type: "UPDATE",
          status: "success",
        });
        await fetchUserData();
      }
    } catch (error) {
      console.error("Failed to update nickname:", error);
      showAlert({
        title: "Error",
        message: `Failed to update nickname. Please try again.`,
        type: "ERROR",
        status: "error",
      });
    } finally {
      setLoading(false);
      
    }
  };

  const handleIncognitoNameUpdate = async (newName: string) => {
    console.log("New Incognito Name: ", newName);
    if (!verifyValidName(newName)) {
      showAlert({
        title: "Invalid Incognito Name",
        message: `Incognito Name can only contain alphanumeric characters, '_', '-', and '.' and must be at most 20 characters long`,
        type: "ERROR",
        status: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetchAPI("/api/users/updateUserInfo", {
        method: "PATCH",
        body: JSON.stringify({
          clerkId: user!.id,
          incognito_name: newName,
        }),
      });

      //console.log("Changed Incognito Name", response)
      if (response.error) {
        throw new Error(response.error);
      } else {
        showAlert({
          title: "New Incognito Name",
          message: `Incognito Name updated successfully to ${newName}.`,
          type: "UPDATE",
          status: "success",
        });
        await fetchUserData();
      }
    } catch (error) {
      console.error("Failed to update incognito name:", error);
      showAlert({
        title: "Error",
        message: `Failed to update incognito name. Please try again.`,
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
      const response = await fetchAPI("/api/users/updateUserInfo", {
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
      await encryptionCache.clearDerivedKey();
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
    setUpdateType(type);
    setOnFocus(true);
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

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const y = event.nativeEvent.contentOffset.y;
    setScrollOffset({
      x: x,
      y: y,
    });
  };

  const maskedIncognito = "*".repeat(incognitoName.length);

  return (
    <ScrollView
      className="flex-1 pt-6 bg-gray-50"
      onScroll={onScroll}
      scrollEnabled={!onFocus}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 90 }}
    >
      {/* Color Section */}
      <View className="mx-4 mb-6">
        <HeaderCard
          title="SRB Progression"
          color="#FFFFFF"
          content={
            <>
              {/* Blue Progress */}
              <View className="px-5 py-2">
                <Text className="text-[14px] font-JakartaSemiBold text-gray-800 my-2">
                  🔵 Blue Level
                </Text>

                <ProgressBar
                  progress={blueProgress}
                  height={12}
                  progressColor="#60a5fa"
                  backgroundColor="#fafafa"
                />
              </View>

              {/* Yellow Progress */}
              <View className="px-5 py-2">
                <Text className="text-[14px] font-JakartaSemiBold text-gray-800 my-2">
                  🟡 Yellow Level
                </Text>

                <ProgressBar
                  progress={yellowProgress}
                  height={12}
                  progressColor="#facc15"
                  backgroundColor="#fafafa"
                />
              </View>

              {/* Pink Progress */}
              <View className="px-5 py-2">
                <Text className="text-[14px] font-JakartaSemiBold text-gray-800 my-2">
                  🩷 Pink Level
                </Text>

                <ProgressBar
                  progress={pinkProgress}
                  height={12}
                  progressColor="#FBB1F5"
                  backgroundColor="#fafafa"
                />
              </View>
              <ActionRow
                icon={
                  <Image
                    source={icons.palette}
                    tintColor="#000"
                    resizeMode="contain"
                    className="w-5 h-5"
                  />
                }
                label="View Color Library"
                count={colorLibrary.length || 0}
                onPress={() => setLibraryVisible(true)}
                accentColor="#CFB1FB"
              />
              <ActionRow
                icon={
                  <Image
                    source={icons.sparkles}
                    tintColor="#000"
                    resizeMode="contain"
                    className="w-5 h-5"
                  />
                }
                label="Attempt Create Color"
                count={3}
                onPress={handleAttemptColorCreation}
                accentColor="#CFB1FB"
              />
            </>
          }
          infoView={
            <>
            <SRBInfoPage />
            </>}
        />
      </View>

      {/* Information Section */}
      <View className="mx-4 mb-6">
        <HeaderCard
          title="Information"
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
                label="Nickname"
                value={nickname}
                onPress={() => handleUpdateValue("nickname")}
                accentColor="#93c5fd"
              />
              <DetailRow
                label="Incognito Name"
                value={maskedIncognito}
                onPress={() => handleUpdateValue("incognito_name")}
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
          infoView={
             <>
            <InformationInfoPage />
            </>
          }
        />
      </View>

      {/* Activity Section */}
      <View className="mx-4 mb-6">
        <HeaderCard
          title="Your Activity"
          color="#CFB1FB"
          content={
            <>
              <ActionRow
                icon={
                  <Image
                    source={icons.bookmark}
                    tintColor="#000"
                    resizeMode="contain"
                    className="w-5 h-5"
                  />
                }
                label="Saved Posts"
                count={savedPosts?.length || 0}
                onPress={() =>
                  router.push({
                    pathname: "/root/saved-post-gallery",
                    params: {
                      posts: JSON.stringify(savedPosts),
                      name: "Saved Posts",
                    },
                  })
                }
                accentColor="#CFB1FB"
              />
              <ActionRow
                icon={
                  <MaterialCommunityIcons
                    name="heart-outline"
                    size={20}
                    color="#000"
                  />
                }
                label="Liked Posts"
                count={likedPosts?.length || 0}
                onPress={() =>
                  router.push({
                    pathname: "/root/saved-post-gallery",
                    params: {
                      posts: JSON.stringify(likedPosts),
                      name: "Liked Posts",
                    },
                  })
                }
                accentColor="#CFB1FB"
              />
              <ActionRow
                icon={<AntDesign name="clockcircleo" size={20} color="#000" />}
                label="Quick Reaction Emojis"
                count={0} // Placeholder for future implementation
                onPress={() => {
                  playSoundEffect(SoundType.Navigation);
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
                accentColor="#CFB1FB"
              />
            </>
          }
          infoView={
            <>
            <YourActivityInfoPage />
            </>
          }
        />
      </View>

      {/* Preferences Section */}
      <View className="mx-4 mb-6">
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
          infoView={
             <>
            <PreferencesInfoPage />
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
          <Text className="font-JakartaBold text-lg text-red-500">
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>

      {onFocus && (
        <KeyboardOverlay onFocus={onFocus} offsetY={scrollOffset.y}>
          <RenameContainer
            onSave={(newName: string) => {
              if (type === "username") {
                handleUsernameUpdate(newName);
                console.log("[Settings] New Username: ", newName)
              } else if (type === "nickname") {
                handleNicknameUpdate(newName);
              } else if (type === "incognito_name") {
                handleIncognitoNameUpdate(newName);
              } else {
                handleEmailUpdate(newName);
              }
            }}
            placeholder={
              type === "username"
                ? username
                : type === "nickname"
                  ? nickname
                  : type === "incognito_name"
                    ? incognitoName
                    : email
            }
            onCancel={() => setOnFocus(false)}
          />
        </KeyboardOverlay>
      )}
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

      {libraryVisible && (
        <ModalSheet
          title={"Your Color Library"}
          isVisible={libraryVisible}
          onClose={() => {}}
        >
          <View className="flex-1 p-6">
            <FlatList
              className="flex-1"
              data={colorLibrary}
              keyExtractor={(item, index) => index.toString()}
              ListEmptyComponent={
                <Text style={{ fontSize: 16, color: "gray" }}>
                  You haven't collected any colors yet.
                </Text>
              }
              renderItem={({ item }) => (
                <ItemContainer
                  label={item.name}
                  caption={item.meaning || "No description available."}
                  icon={0}
                  colors={[item.hex, item.foldcolorhex]}
                  iconColor={""}
                  onPress={() => {}}
                />
              )}
              contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            />
            <CustomButton
              className="my-2 w-[50%] h-14 self-center rounded-full shadow-none bg-black"
              fontSize="lg"
              title="Close"
             padding={4}
              onPress={() => {
                setLibraryVisible(false);
              }}
            />
          </View>
        </ModalSheet>
      )}
    </ScrollView>
  
  );
};

export default Settings;


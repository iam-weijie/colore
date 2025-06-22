// Need to configure Email Verification & Update
import { useNavigationContext } from "@/components/NavigationContext";
import { icons } from "@/constants";
import { allColors, defaultColors } from "@/constants/colors";
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
import { useSettingsContext } from "@/app/contexts/SettingsContext";
import { useProfileContext } from "@/app/contexts/ProfileContext";
import { useEncryptionContext } from "@/app/contexts/EncryptionContext";
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
import { calculateSRB, handleNewColor } from "@/hooks/useColors";
import { colorMatch } from "@/lib/colorsystem";

const Settings = () => {
  const {
    hapticsEnabled,
    setHapticsEnabled,
    soundEffectsEnabled,
    setSoundEffectsEnabled,
  } = useSettingsContext();

  const {
    profile,
    setProfile,
    refreshProfile,
    userColors,
  } = useProfileContext();
  const { setEncryptionKey } = useEncryptionContext();
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
    userColors || defaultColors
  );

  const [blueProgress, setBlueProgress] = useState<number>(0);
  const [yellowProgress, setYellowProgress] = useState<number>(0);
  const [pinkProgress, setPinkProgress] = useState<number>(0); 
  const [trustProgress, setTrustProgress] = useState<number>(0);
  
  const [remainingAttempts, setRemainingAttempts] = useState<number>(4);

  const handleAttemptColorCreation = async () => {
   
    let matchedColor;
    const { color, attempts, context } = colorMatch([blueProgress, pinkProgress, yellowProgress], remainingAttempts)

    setRemainingAttempts(attempts)

    if (color) { matchedColor = color }


    if (matchedColor) {
      const alreadyUnlocked = colorLibrary.some(
        (uc) => uc.id === matchedColor.id
      );

      if (!alreadyUnlocked) {
        setColorLibrary((prev) => [...prev, matchedColor]);
      
      const { status } = await handleNewColor(user!.id, matchedColor);
      
        if (status == 200) {
        showAlert({
          title: "🎉 Color Unlocked!",
          message: `${matchedColor.name} has been added to your collection.`,
          type: "UPDATE",
          status: "success",
          color: matchedColor.hex
        });
      }
      
      } else {
        showAlert({
          title: "Already Unlocked",
          message: `You already have ${matchedColor.name}.`,
          type: "UPDATE",
          status: "warning",
          color: matchedColor.hex
        });
      }
    } else {
      showAlert({
        title: "No Match",
        message: context || "Your current SRB doesn't match any color. Try again later!",
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
      const response = await fetchAPI(`/api/posts/getUserSavedPosts?userId=${user!.id}`);
      const data = response.data;
      if (data.length == 0 ) setSavedPosts([])
        console.log("[]settings", response, data)
      setSavedPosts(data.map((post: { post_id: string }) => post.post_id));
    } catch (error) {
      console.error("Failed to fetch saved post data:", error);
    }
  };

  const getSRB = async () => {
    try {
    const result = await calculateSRB(user!.id, colorLibrary)
   setBlueProgress(result.S);
   setYellowProgress(result.B);
   setPinkProgress(result.R);
   setTrustProgress(result.Trust);
    } catch (error) {
      console.error("failed to compute SRB", error)
    }
  }


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
    getSRB()
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
      console.log("[DEBUG] Settings - Sign out button pressed");
      
      // Loading state is now set by the button press
      // No need to show alert here as it's shown by the button press
      
      // Clear encryption key
      console.log("[DEBUG] Settings - Clearing encryption key");
      await setEncryptionKey(null);
      
      // Sign out the user
      console.log("[DEBUG] Settings - Calling signOut()");
      await signOut();
      await encryptionCache.clearDerivedKey();
      setLoading(true);
      router.replace("/auth/onboarding");
    } catch (error) {
      console.error("[DEBUG] Settings - Error signing out:", error);
      showAlert({
        title: "Error",
        message: `Failed to sign out. Please try again.`,
        type: "ERROR",
        status: "error",
      });
      setLoading(false);
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
                  Author Score (S)
                </Text>

                <ProgressBar
                  progress={blueProgress}
                  height={12}
                  progressColor="#60a5fa"
                  backgroundColor="#fafafa"
                />
              </View>

              {/* Pink Progress */}
              <View className="px-5 py-2">
                <Text className="text-[14px] font-JakartaSemiBold text-gray-800 my-2">
                  Creative Score (R) 
                </Text>

                <ProgressBar
                  progress={pinkProgress}
                  height={12}
                  progressColor="#FBB1F5"
                  backgroundColor="#fafafa"
                />
              </View>
             
             {/* Yellow Progress */}
              <View className="px-5 py-2">
                <Text className="text-[14px] font-JakartaSemiBold text-gray-800 my-2">
                  Engagement Score (B)
                </Text>

                <ProgressBar
                  progress={yellowProgress}
                  height={12}
                  progressColor="#facc15"
                  backgroundColor="#fafafa"
                />
              </View>

              <View className="mt-4">
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
                count={remainingAttempts}
                onPress={handleAttemptColorCreation}
                accentColor="#CFB1FB"
              />
              </View>
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
                label="Saved Notes"
                count={savedPosts?.length || 0}
                onPress={() =>
                  router.push({
                    pathname: "/root/saved-post-gallery",
                    params: {
                      posts: JSON.stringify(savedPosts),
                      name: "Saved Notes",
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
                label="Liked Notes"
                count={likedPosts?.length || 0}
                onPress={() =>
                  router.push({
                    pathname: "/root/saved-post-gallery",
                    params: {
                      posts: JSON.stringify(likedPosts),
                      name: "Liked Notes",
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
          onPress={() => {
            console.log("[DEBUG] Settings - Sign out button pressed directly");
            // Add delay to prevent multiple presses
            if (loading) return;
            setLoading(true);
            // Show visual feedback immediately
            showAlert({
              title: "Signing Out",
              message: "Please wait while we sign you out...",
              type: "UPDATE",
              status: "success",
            });
            // Execute sign out after a short delay to allow UI to update
            setTimeout(() => {
              handleSignOut();
            }, 100);
          }}
          disabled={loading}
          activeOpacity={0.5}
          className={`${loading ? 'bg-gray-200' : 'bg-white'} rounded-[32px] p-4 shadow-sm overflow-hidden flex items-center justify-center border-2 border-gray-100`}
          style={{
            shadowColor: "#636363",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3, // Add elevation for Android shadow
          }}
        >
          <Text className={`font-JakartaBold text-lg ${loading ? 'text-gray-500' : 'text-red-500'}`}>
            {loading ? "Signing Out..." : "Sign Out"}
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
                    ? maskedIncognito
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
            <View className="w-full flex-row justify-center">
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
          </View>
        </ModalSheet>
      )}
    </ScrollView>
  
  );
};

export default Settings;


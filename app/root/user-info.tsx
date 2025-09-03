import { useUser } from "@clerk/clerk-expo";
import { router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { useNavigationContext } from "@/components/NavigationContext";
import { fetchAPI } from "@/lib/fetch";
import { useAlert } from '@/notifications/AlertContext';
import CarouselPage from "@/components/CarrousselPage";
import { PostItColor, UserNicknamePair } from "@/types/type";
import BoardGallery from "@/components/BoardGallery";
import ItemContainer from "@/components/ItemContainer";
import { icons } from "@/constants";
import { allColors, defaultColors } from "@/constants/colors";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import React from "react";
import { SoundType, useSoundEffects } from "@/hooks/useSoundEffects";
import { useSettingsContext } from "@/app/contexts/SettingsContext";
import { useProfileContext } from "@/app/contexts/ProfileContext";
import * as Haptics from "expo-haptics";
import { deriveKey } from "@/lib/encryption";
import { FindUser } from "@/components/FindUsers";
import { useBackgroundColor } from "@/hooks/useTheme";

const UserInfo = () => {
  const { playSoundEffect } = useSoundEffects();
  const { soundEffectsEnabled } = useSettingsContext();

  const { user } = useUser();
  const { showAlert } = useAlert();

  const backgroundColor = useBackgroundColor()


  console.log(
    "[user-info]: ",
    allColors.length,
    allColors.find((c) => c.id === "pink")
  );
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
    allColors.find((c) => c.id === "pink") as PostItColor
  );

  const [inputHeight, setInputHeight] = useState(40);
  const [discoverBoards, setDiscoverBoards] = useState<any>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>([]);

  const [users, setUsers] = useState<any>();
  const [searchText, setSearchText] = useState<string>("");

  //console.log("user", user)
  const [userData, setUserData] = useState({
    city: "",
    state: "",
    country: "",
    email: "",
    username: "",
    nickname: "",
    incognito_name: "",
  });
  const [loading, setLoading] = useState(false);

  const totalSteps = 5;
  const [step, setStep] = useState(0);

  const maxCharacters = 3000;
  const fetchUserData = async () => {
    try {
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`, {
        method: "GET",
      });
      if (response.error) {
        if (response.error === "User not found") {
          // Check if user exists with this email address
          const email = user!.emailAddresses[0]?.emailAddress || "";
          try {
            const emailCheckResponse = await fetchAPI(`/api/users/getUserByEmail?email=${encodeURIComponent(email)}`, {
              method: "GET",
            });
            
            if (emailCheckResponse.error) {
              // User does not exist by email either, create a new user
              console.log("Creating new user with email:", email);
              await fetchAPI("/api/users/newUser", {
                method: "POST",
                body: JSON.stringify({
                  email: email,
                  clerkId: user!.id,
                  appleId:
                    user!.externalAccounts.find(
                      (account) => account.provider === "apple"
                    )?.id || "",
                }),
              });
              // Fetch the newly created user
              const newUserResponse = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`, {
                method: "GET",
              });
              if (!newUserResponse.error) {
                return newUserResponse.data[0];
              }
            } else {
              // User exists with this email but different clerk_id
              // For security reasons, we'll just use their existing account data
              console.log("Found user with matching email but different clerk_id");
              return emailCheckResponse;
            }
          } catch (emailCheckErr) {
            console.error("Error checking user by email:", emailCheckErr);
          }
        } else {
          throw new Error(response.error);
        }
      }
      const salt = response.data[0].salt;
      return response.data[0];
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  const fetchDiscoverBoards = async () => {
    try {
      const response = await fetchAPI(
        `/api/boards/getDiscoverBoards?userId=${user!.id}`,
        {
          method: "GET",
        }
      );
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        const boardsWithColor = response.data.map(
          (board: any, index: number) => ({
            ...board,
            color:
              defaultColors[Math.floor(Math.random() * defaultColors.length)]
                .hex, // only assign if not already set
          })
        );

        if (boardsWithColor.length > 0) {
          const membership = boardsWithColor.filter((b) =>
            b.members_id?.includes(user!.id)
          );
          const membership_id = membership.map((b) => b.id);
          setJoinedCommunities([...membership_id]);
          setDiscoverBoards([...boardsWithColor]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch board data:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetchAPI(
        `/api/users/getUsers?id=${user!.id}?=maxUsers=10`,
        {
          method: "GET",
        }
      );

      const data = response.data.filter((u) => u.username);

      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      const data = await fetchUserData();

      setForm({
        ...form,
        username: data.username,
        incognito_name: data.incognito_name,
        userLocation: `${data.city}, ${data.state}, ${data.country}`,
      });
      if (
        data.city &&
        data.state &&
        data.country &&
        data.email &&
        data.username &&
        data.incognito_name
      ) {
        router.replace("/root/tabs/home");
      } else {
        setUserData({
          city: data.city,
          state: data.state,
          country: data.country,
          email: data.email,
          username: data.username,
          nickname: data.nickname,
          incognito_name: data.incognito_name,
        });
      }

      setLoading(false);
    };
    getData();
    fetchDiscoverBoards();
    fetchUsers();
  }, [user]);

  const currentScreen = usePathname().replace("/", "");
  const { stateVars, setStateVars } = useNavigationContext();

  const [form, setForm] = useState({
    username: userData.username || stateVars.username || user?.username || "",
    nickname: userData.nickname || stateVars.nickname || "",
    incognito_name: userData.incognito_name || stateVars.incognito_name || "",
    userLocation: stateVars.userLocation || "",
  });

  const handleNavigateToCountry = () => {
    playSoundEffect(SoundType.Navigation);
    Haptics.selectionAsync();

    setStateVars({
      ...stateVars,
      previousScreen: currentScreen,
      username: form.username,
      incognito_name: form.incognito_name,
      city: stateVars.city || "",
      state: stateVars.state || "",
      country: stateVars.country || "",
    });
    router.push("/root/location/country");
  };

  useEffect(() => {
    setForm((prevForm) => ({
      ...prevForm, // Spread previous form state
      userLocation: stateVars.userLocation, // Update only the userLocation
    }));
  }, [stateVars.userLocation]);
  const verifyValidUsername = (username: string): boolean => {
    const usernameRegex = /^[\w\-\.]{1,20}$/;
    return usernameRegex.test(username);
  };

  const handleGetStarted = async () => {
    if (!form.username || !form.userLocation) {
      showAlert({
        title: "Error",
        message: `Please fill out all fields.`,
        type: "ERROR",
        status: "error",
      });
      return;
    }

    if (!verifyValidUsername(form.username)) {
      showAlert({
        title: "Invalid Username",
        message:
          "Username can only contain alphanumeric characters, '_', '-', and '.' and must be at most 20 characters long",
        type: "ERROR",
        status: "error",
      });
      return;
    }
    try {
      const response = await fetchAPI("/api/users/newUserInfo", {
        method: "POST",
        body: JSON.stringify({
          username: form.username,
          incognito_name: form.incognito_name,
          city: stateVars.city,
          state: stateVars.state,
          country: stateVars.country,
          clerkId: user!.id,
        }),
      });
      if (response.error) {
        if (
          response.error.detail ===
          `Key (username)=(${form.username}) already exists.`
        ) {
          showAlert({
            title: "Username taken",
            message: `Username ${form.username} already exists. Please try another one.`,
            type: "ERROR",
            status: "error",
          });
        } else {
          throw new Error(response.error);
        }
      } else {
        router.push("/root/tabs/home");
      }
    } catch (error) {
      console.error("Failed to post user data:", error);
    }
  };

  const handleColorSelect = (color: PostItColor) => {
    setSelectedColor(color);
  };

  // need to get user's screen size to set a min height
  const screenHeight = Dimensions.get("screen").height;

  const handleContentSizeChange = (event: any) => {
    setInputHeight(event.nativeEvent.contentSize.height);
  };


  // RENDER START

  const ListItem = ({ item }) => {
    const hasJoined = joinedCommunities.some((b) => b == item.id);

    return (
      <ItemContainer
        label={`${item.title ?? item.username}`}
        caption={`${item.description ?? item.country + ", " + item.state + ", " + item.city ?? ""}`}
        colors={item.title ? ["#CFB1FB", "#93c5fd"] : ["#CFB1FB", "#93c5fd"]}
        icon={item.title ? icons.hamburgerMenu : icons.addUser}
        iconColor="#22c722"
        actionIcon={hasJoined && icons.check}
        onPress={async () => {
          playSoundEffect(SoundType.Submit);
          Haptics.selectionAsync();

          if (item.username) {
            router.push({
              pathname: "/root/profile/[id]",
              params: { id: item.clerk_id },
            });
          } else {
            // continue existing logic...

            const response = await fetchAPI(
              `/api/boards/handleJoiningCommunityBoard`,
              {
                method: "PATCH",
                body: JSON.stringify({
                  clerkId: user!.id,
                  boardId: item.id,
                  isJoining: !hasJoined,
                }),
              }
            );

            if (response.data[0].user_id != user!.id) {
              if (!hasJoined) {
                setJoinedCommunities((prev) => [...prev, item.id]);
              } else {
                setJoinedCommunities((prev) =>
                  prev.filter((b) => b != item.id)
                );
              }
            }

            if (!response.success) {
              showAlert({
                title: "Error",
                message: `You cannot leave a community you created.`,
                type: "ERROR",
                status: "error",
              });
            }
          }
        }}
      />
    );
  };

  // RENDER END

  const pages = [
    {
      label: "Choose a username",
      caption: "This will be your public name across the app. Choose wisely!",
      color: "#93c5fd",
      disabled: !form.username,
      children: (
        <View className="flex-1 flex-col ">
        <InputField
          label=""
          placeholder="Your Username"
          containerStyle="w-full"
          inputStyle="p-4"
          value={form.username}
          onChangeText={(value) => setForm({ ...form, username: value })}
        />
        </View>
      ),
    },
    {
      label: "Choose an incognito name",
      caption:
        "This will be the name your friends see to maintain your anonymity.",
      color: "#93c5fd",
      disabled: !form.incognito_name,
      children: (
        <View className="flex-1 flex-col ">
        <InputField
          label=""
          placeholder="Your Incognito Name"
          containerStyle="w-full "
          inputStyle="p-4"
          value={form.incognito_name}
          onChangeText={(value) => setForm({ ...form, incognito_name: value })}
        />
        </View>
      ),
    },
    {
      label: "Where are you?",
      caption: "Tell us your city and country to personalize your experience.",
      color: "#ffe640",
      disabled: !form.userLocation,
      children: (
        <View className="my-2 w-full flex-1 flex-col">
          <View className="flex flex-row justify-start items-center relative bg-neutral-100 rounded-full border border-neutral-100 focus:border-primary-500 ">
            <Pressable onPress={handleNavigateToCountry}>
              <TextInput
                className="rounded-full p-4 w-full font-JakartaSemiBold text-[17px]  text-left"
                placeholder="Your Location"
                placeholderTextColor="#c0c0c0"
                value={form.userLocation}
                editable={false}
                onPressIn={handleNavigateToCountry}
              />
            </Pressable>
          </View>
        </View>
      ),
    },
    {
      label: "Join a community",
      caption:
        "Choose at least one. Find your people! We'll suggest communities you might like.",
      color: "#CFB1FB",
      disabled: discoverBoards.length != 0 && joinedCommunities.length == 0,
      children: (
        <View className="flex-1">
          <FlatList
            className="rounded-[16px] mt-4 mb-20 z-[10]"
            data={discoverBoards}
            contentContainerStyle={{
              paddingBottom: 40,
              justifyContent: "center",
            }}
            renderItem={ListItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <Text className="text-center text-gray-500">
                No board to discover
              </Text>
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      ),
    },
    {
      label: "Add friends",
      caption: "Invite friends or find others to connect with!",
      color: "#8B5CF6",
      disabled: false,
      children: (
        <View className="flex-1">
          <FindUser selectedUserInfo={(item: UserNicknamePair) => {
                          router.push({
                            pathname: "/root/profile/[id]",
                            params: { userId: item[0], username: item[1] },
                          });
                        }} />
        </View>
      ),
    },
  ];


  const handleUpdatedModification = async () => {
    if (!form.username || !form.userLocation) {
      showAlert({
        title: "Error",
        message: `Please fill out all fields.`,
        type: "ERROR",
        status: "error",
      });
      return;
    }

    try {
      const response = await fetchAPI("/api/users/updateUserInfo", {
        method: "PATCH",
        body: JSON.stringify({
          username: form.username,
          incognito_name: form.incognito_name,
          city: stateVars.city,
          state: stateVars.state,
          country: stateVars.country,
          clerkId: user!.id,
        }),
      });
      if (response.error) {
        if (
          response.error.detail ===
          `Key (username)=(${form.username}) already exists.`
        ) {
          showAlert({
            title: "Username taken",
            message: `Username ${form.username} already exists. Please try another one.`,
            type: "ERROR",
            status: "error",
          });
        } else {
          throw new Error(response.error);
        }
      } else {
        router.push("/root/tabs/home");
      }
    } catch (error) {
      console.error("Failed to post user data:", error);
    }
  }

  const handleNext = () => {
    playSoundEffect(SoundType.Navigation);
    Haptics.selectionAsync();

    if (step < totalSteps - 1) setStep((prev) => prev + 1);
    else {
      
      handleUpdatedModification()
    }
  };

  return (
    <SafeAreaView 
    className="flex-1"
    style={{
      backgroundColor: backgroundColor
    }}>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ColoreActivityIndicator text="Summoning Bob..." paddingType="fullPage"/>
        </View>
      ) : (
        <CarouselPage
          label={pages[step].label}
          caption={pages[step].caption}
          color={pages[step].color}
          onSubmit={handleNext}
          progress={step + 1}
          total={totalSteps}
          disabled={pages[step].disabled}
        >
          {pages[step].children}
        </CarouselPage>
      )}
    </SafeAreaView>
  );
};

export default UserInfo;

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
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { useNavigationContext } from "@/components/NavigationContext";
import { fetchAPI } from "@/lib/fetch";
import { useAlert } from "@/notifications/AlertContext";
import CarouselPage from "@/components/CarrousselPage";
import { temporaryColors } from "@/constants";
import { PostItColor } from "@/types/type";
import BoardGallery from "@/components/BoardGallery";
import ItemContainer from "@/components/ItemContainer";
import { icons } from "@/constants";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import React from "react";
import ColorPickerSlider from "@/components/ColorPickerSlider";
import { SoundType, useSoundEffects } from "@/hooks/useSoundEffects";
import { useGlobalContext } from "../globalcontext";
import * as Haptics from "expo-haptics";

const UserInfo = () => {
  const { playSoundEffect } = useSoundEffects();
  const { soundEffectsEnabled } = useGlobalContext();

  const { user } = useUser();
  const { showAlert } = useAlert();

  const [postContent, setPostContent] = useState("");
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
    temporaryColors.find((c) => c.name === "pink") as PostItColor
  );

  const [inputHeight, setInputHeight] = useState(40);

  const [discoverBoards, setDiscoverBoards] = useState<any>();
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
          await fetchAPI("/api/users/newUser", {
            method: "POST",
            body: JSON.stringify({
              email: user!.emailAddresses[0]?.emailAddress || "",
              clerkId: user!.id,
              appleId:
                user!.externalAccounts.find(
                  (account) => account.provider === "apple"
                )?.id || "",
            }),
          });
        } else {
          throw new Error(response.error);
        }
      }
      return response.data[0];
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  const fetchPersonalPosts = async () => {
    const response = await fetchAPI(
      `/api/posts/getPersonalPosts?number=${8}&recipient_id=${user!.id}&user_id=${user!.id}`
    );

    if (response.data.length > 0) {
      const filteredPosts = response.data.filter((p) => p.pinned);
      return filteredPosts;
    } else {
      return [];
    }
  };
  const fetchDiscoverBoards = async () => {
    try {
      const response = await fetchAPI(`/api/boards/getDiscoverBoards`, {
        method: "GET",
      });
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        const boardsWithColor = response.data.map(
          (board: any, index: number) => ({
            ...board,
            color: temporaryColors[Math.floor(Math.random() * 4)].hex, // only assign if not already set
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
      const post = await fetchPersonalPosts();

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
        post.length > 0
      ) {
        router.replace("/root/tabs/home");
      } else {
        setUserData({
          city: data.city,
          state: data.state,
          country: data.country,
          email: data.email,
          username: data.username,
          incognito_name: data.incognito_name,
        });
      }

      setLoading(false);
    };
    getData();
    fetchDiscoverBoards();
    fetchUsers();
  }, [user]);

  const submitPost = async () => {
    setLoading(true);
    const cleanedContent = postContent;
    if (cleanedContent === "") {
      showAlert({
        title: "Error",
        message: `Post cannot be empty.`,
        type: "ERROR",
        status: "error",
      });
      return;
    }
    try {
      await fetchAPI("/api/posts/newPersonalPost", {
        method: "POST",
        body: JSON.stringify({
          content: cleanedContent,
          clerkId: user!.id,
          recipientId: user!.id,
          postType: "personal",
          color: selectedColor.name,
          pinned: true,
        }),
      });

      setTimeout(() => {
        showAlert({
          title: "Success",
          message: `Post created.`,
          type: "POST",
          status: "success",
        });
      }, 500);
    } catch (error) {
      showAlert({
        title: "Error",
        message: `An error occurred. Please try again.`,
        type: "ERROR",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentScreen = usePathname().replace("/", "");
  const { stateVars, setStateVars } = useNavigationContext();

  const [form, setForm] = useState({
    username: userData.username || stateVars.username || user?.username || "",
    incognito_name: userData.incognito_name || stateVars.incognito_name || "",
    userLocation: stateVars.userLocation || "",
  });

  const handleChangeText = (text: string) => {
    if (text.length <= maxCharacters) {
      setPostContent(text);
    } else {
      setPostContent(text.substring(0, maxCharacters));
      showAlert({
        title: "Limit Reached",
        message: `You can only enter up to ${maxCharacters} characters.`,
        type: "ERROR",
        status: "error",
      });
    }
  };

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
    console.log("Update location");
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

  const filteredUsers =
    searchText.length > 0
      ? users.filter((user) =>
          user.username?.toLowerCase().includes(searchText.toLowerCase())
        )
      : users;

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
        <InputField
          label="Username"
          placeholder="Your Username"
          containerStyle="w-full"
          inputStyle="p-4"
          value={form.username}
          onChangeText={(value) => setForm({ ...form, username: value })}
        />
      ),
    },
    {
      label: "Choose an incognito name",
      caption:
        "This will be the name your friends see to maintain your anonymity.",
      color: "#93c5fd",
      disabled: !form.username,
      children: (
        <InputField
          label="Incognito Name"
          placeholder="Your Incognito Name"
          containerStyle="w-full"
          inputStyle="p-4"
          value={form.incognito_name}
          onChangeText={(value) => setForm({ ...form, incognito_name: value })}
        />
      ),
    },
    {
      label: "Where are you?",
      caption: "Tell us your city and country to personalize your experience.",
      color: "#ffe640",
      disabled: !form.userLocation,
      children: (
        <View className="my-2 w-full">
          <Text className="text-lg font-JakartaSemiBold mb-3">Location</Text>
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
      label: "About you",
      caption: "Share something cool about yourself!",
      color: "#FBB1F5",
      disabled: postContent.length == 0,
      children: (
        <View className="flex-1">
          <View
            className="flex-1 mx-6 mt-0 rounded-[48px] overflow-hidden shadow-sm border-4"
            style={{
              backgroundColor: selectedColor.hex,
              borderColor: "#ffffff80",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
            }}
          >
            <View className="flex-1 flex-column justify-center items-center ">
              <View className="flex w-full ">
                <View>
                  <TextInput
                    className="text-[20px] text-white p-5 rounded-[24px] font-JakartaBold mx-10 "
                    placeholder="Type something..."
                    value={postContent}
                    onChangeText={handleChangeText}
                    onContentSizeChange={handleContentSizeChange}
                    autoFocus
                    multiline
                    scrollEnabled
                    style={{
                      paddingTop: 10,
                      paddingBottom: 0,
                      minHeight: screenHeight * 0.2,
                      maxHeight: screenHeight * 0.5,
                      textAlignVertical: "top",
                    }}
                  />
                </View>
              </View>
            </View>

            <View className="flex-1 absolute m-4 left-4 top-2">
              <Text className="text-[16px] font-JakartaBold text-white"></Text>
            </View>
            <View className="flex-1 flex-col items-end absolute p-4 right-0">
              <ColorPickerSlider
                colors={temporaryColors}
                selectedColor={selectedColor}
                onColorSelect={handleColorSelect}
              />
              <View className="flex flex-row items-center"></View>
            </View>
          </View>
        </View>
      ),
    },
    {
      label: "Join a community",
      caption:
        "Choose at least one. Find your people! We’ll suggest communities you might like.",
      color: "#CFB1FB",
      disabled: joinedCommunities.length == 0,
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
          <View className="flex-grow mt-4 mx-4">
            <TextInput
              className="w-full h-12 px-3 -pt-1 bg-[#FAFAFA] rounded-[16px] text-[12px] focus:outline-none focus:border-blue-500 focus:ring-blue-500"
              placeholder="Search users..."
              placeholderTextColor="#888"
              value={searchText}
              onChangeText={(text): void => setSearchText(text)}
            />
          </View>
          <FlatList
            className="rounded-[16px] mt-4 mb-20 z-[10]"
            data={filteredUsers}
            contentContainerStyle={{
              paddingBottom: 40,
              justifyContent: "center",
            }}
            renderItem={ListItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <Text className="text-center text-gray-500">
                No users available
              </Text>
            }
            showsVerticalScrollIndicator={true}
          />
        </View>
      ),
    },
  ];

  const handleNext = () => {
    playSoundEffect(SoundType.Navigation);
    Haptics.selectionAsync();

    if (step < totalSteps - 1) setStep((prev) => prev + 1);
    else {
      submitPost();
      router.push("/root/tabs/home");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ColoreActivityIndicator text="Summoning Bob..." />
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

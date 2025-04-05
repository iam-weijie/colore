import { useUser } from "@clerk/clerk-expo";
import { router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { useNavigationContext } from "@/components/NavigationContext";
import { fetchAPI } from "@/lib/fetch";
import { useAlert } from '@/notifications/AlertContext';

const UserInfo = () => {
  const { user } = useUser();
  const { showAlert } = useAlert();
  //console.log("user", user)
  const [userData, setUserData] = useState({
    city: "",
    state: "",
    country: "",
    email: "",
    username: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetchAPI(
          `/api/users/getUserInfo?id=${user!.id}`,
          {
            method: "GET",
          }
        );
        if (response.error) {
          if (response.error === "User not found") {
            await fetchAPI("/api/users/newUser", {
              method: "POST",
              body: JSON.stringify({
                email: user!.emailAddresses[0]?.emailAddress || "",
                clerkId: user!.id,
              }),
            });
          } else {
            throw new Error(response.error);
          }
        }
        return response.data[0];
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    const getData = async () => {
      const data = await fetchUserData();
      if (
        data.city &&
        data.state &&
        data.country &&
        data.email &&
        data.username
      ) {
        router.replace("/root/tabs/home");
      } else {
        setUserData({
          city: data.city,
          state: data.state,
          country: data.country,
          email: data.email,
          username: data.username,
        });
      }
    };
    getData();
  }, [user]);

  const currentScreen = usePathname().replace("/", "");
  const { stateVars, setStateVars } = useNavigationContext();

  const [form, setForm] = useState({
    username: userData.username || stateVars.username || user?.username || "",
    userLocation: stateVars.userLocation || "",
  });


  const handleNavigateToCountry = () => {
    setStateVars({
      ...stateVars,
      previousScreen: currentScreen,
      username: form.username,
      city: stateVars.city || "",
      state: stateVars.state || "",
      country: stateVars.country || "",
    });
    router.push("/root/location/country");
  };

  useEffect(() => {
    console.log("Update location");
    setForm(prevForm => ({
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
        title: 'Error',
        message: `Please fill out all fields.`,
        type: 'ERROR',
        status: 'error',
      });
      return;
    }

    if (!verifyValidUsername(form.username)) {
      showAlert({
        title: 'Invalid Username',
        message: "Username can only contain alphanumeric characters, '_', '-', and '.' and must be at most 20 characters long",
        type: 'ERROR',
        status: 'error',
      });
      return;
    }
    try {
      const response = await fetchAPI("/api/users/newUserInfo", {
        method: "POST",
        body: JSON.stringify({
          username: form.username,
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
            title: 'Username taken',
            message: `Username ${form.username} already exists. Please try another one.`,
            type: 'ERROR',
            status: 'error',
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

  return (
    <SafeAreaView className="flex-1">
      {loading ? (
        <View className="flex-[0.8] justify-center items-center">
          <ActivityIndicator size="large" color="black" />
        </View>
      ) : (
        <ScrollView
          className="px-5"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <Text className="text-2xl font-JakartaBold my-5">Who are you 👀</Text>
          <View className="flex flex-col items-start justify-center bg-white rounded-[36px] px-5 py-3">
            <View className="flex flex-col items-start justify-start w-full">
              <InputField
                label="Username"
                placeholder="Your Username"
                containerStyle="w-full"
                inputStyle="p-3.5"
                value={form.username}
                onChangeText={(value) => setForm({ ...form, username: value })}
              />

              <View className="my-2 w-full">
                <Text className="text-lg font-JakartaSemiBold mb-3">
                  Location
                </Text>
                <View className="flex flex-row justify-start items-center relative bg-neutral-100 rounded-full border border-neutral-100 focus:border-primary-500 ">
                  <Pressable onPress={handleNavigateToCountry}>
                    <TextInput
                      className="rounded-full p-4 font-JakartaSemiBold text-[17px] flex-1 text-left"
                      placeholder="Your Location"
                      placeholderTextColor="#c0c0c0"
                      value={form.userLocation}
                      editable={false}
                      onPressIn={handleNavigateToCountry}
                    />
                  </Pressable>
                </View>
              </View>

              <View className="mt-4 w-full">
                <CustomButton
                  title="Get Started"
                  onPress={() => {
                    handleGetStarted();
                  }}
                  className="my-5 bg-indigo-500"
                  disabled={!form.username || !form.userLocation}
                  padding="3"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default UserInfo;

import { useUser } from "@clerk/clerk-expo";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
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
import { calculateAge, formatDate } from "@/lib/utils";

const UserInfo = () => {
  const { user } = useUser();
  const [userData, setUserData] = useState({
    city: "",
    state: "",
    country: "",
    email: "",
    firstname: "",
    lastname: "",
    username: "",
    date_of_birth: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetchAPI(
          `/(api)/(users)/getUserInfo?id=${user!.id}`,
          {
            method: "GET",
          }
        );
        if (response.error) {
          if (response.error === "User not found") {
            await fetchAPI("/(api)/(users)/newUser", {
              method: "POST",
              body: JSON.stringify({
                email: user!.emailAddresses[0]?.emailAddress,
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
        data.firstname &&
        data.lastname &&
        data.username &&
        data.date_of_birth
      ) {
        router.replace("/(root)/(tabs)/home");
      } else {
        setUserData({
          city: data.city,
          state: data.state,
          country: data.country,
          email: data.email,
          firstname: data.firstname,
          lastname: data.lastname,
          username: data.username,
          date_of_birth: data.date_of_birth,
        });
      }
    };
    getData();
  }, [user]);

  const currentScreen = usePathname().replace("/", "");
  const { stateVars, setStateVars } = useNavigationContext();

  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

  const [date, setDate] = useState(tenYearsAgo);
  const [dateOfBirth, setDateOfBirth] = useState(stateVars.dateOfBirth || "");
  const [showPicker, setShowPicker] = useState(false);

  const [form, setForm] = useState({
    firstName:
      userData.firstname || stateVars.firstName || user?.firstName || "",
    lastName: userData.lastname || stateVars.lastName || user?.lastName || "",
    username: userData.username || stateVars.username || user?.username || "",
    dateOfBirth: userData.date_of_birth || stateVars.dateOfBirth || "",
    userLocation: stateVars.userLocation || "",
  });

  const toggleDatePicker = () => {
    setShowPicker(!showPicker);
    setDateOfBirth(formatDate(date));
  };

  const onChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      const currentDate = selectedDate;
      setDate(currentDate);

      if (Platform.OS === "android") {
        toggleDatePicker();
        setDateOfBirth(formatDate(currentDate));
      }
    } else {
      toggleDatePicker();
    }
  };

  const handleNavigateToCountry = () => {
    setStateVars({
      ...stateVars,
      previousScreen: currentScreen,
      firstName: form.firstName,
      lastName: form.lastName,
      username: form.username,
      dateOfBirth: dateOfBirth,
      city: stateVars.city || "",
      state: stateVars.state || "",
      country: stateVars.country || "",
    });
    router.push("/(root)/(location)/country");
  };

  const verifyValidUsername = (username: string): boolean => {
    const usernameRegex = /^[\w\-]{1,20}$/;
    return usernameRegex.test(username);
  };

  const handleGetStarted = async () => {
    if (
      !form.firstName ||
      !form.lastName ||
      !form.username ||
      !form.dateOfBirth ||
      !form.userLocation
    ) {
      Alert.alert("Error", "Please fill out all fields.");
      return;
    }
    let temp: number[] = dateOfBirth.split("/").map(Number);
    const age = calculateAge(new Date(Date.UTC(temp[2], temp[0] - 1, temp[1])));

    if (age < 13) {
      Alert.alert(
        "Age Restriction",
        "You must be over 13 years old to use this app."
      );
      return;
    }

    if (!verifyValidUsername(form.username)) {
      Alert.alert(
        "Invalid Username",
        "Username can only contain alphanumeric characters, '_', and '-', and must be at most 20 characters long"
      );
      return;
    }
    try {
      const response = await fetchAPI("/(api)/(users)/newUserInfo", {
        method: "POST",
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          username: form.username,
          dateOfBirth: form.dateOfBirth,
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
          Alert.alert(
            "Username taken",
            `Username ${form.username} already exists. Please try another one.`
          );
        } else {
          throw new Error(response.error);
        }
      } else {
        router.push("/(root)/(tabs)/home");
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
          <View className="flex flex-col items-start justify-center bg-white rounded-lg shadow-sm shadow-neutral-300 px-5 py-3">
            <View className="flex flex-col items-start justify-start w-full">
              <InputField
                label="First name"
                placeholder="Your First Name"
                containerStyle="w-full"
                inputStyle="p-3.5"
                value={form.firstName}
                onChangeText={(value) => setForm({ ...form, firstName: value })}
              />

              <InputField
                label="Last name"
                placeholder="Your Last Name"
                containerStyle="w-full"
                inputStyle="p-3.5"
                value={form.lastName}
                onChangeText={(value) => setForm({ ...form, lastName: value })}
              />

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
                  Date of Birth
                </Text>
                <View className="flex flex-row justify-start items-center relative bg-neutral-100 rounded-full border border-neutral-100 focus:border-primary-500 ">
                  <Pressable onPress={toggleDatePicker}>
                    <TextInput
                      className="rounded-full p-4 font-JakartaSemiBold text-[15px] flex-1 text-left"
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="#c0c0c0"
                      value={dateOfBirth}
                      onChangeText={(value) =>
                        setForm({ ...form, dateOfBirth: value })
                      }
                      editable={false}
                      onPressIn={toggleDatePicker}
                    />
                  </Pressable>
                </View>
              </View>

              {showPicker && (
                <DateTimePicker
                  value={date}
                  display="spinner"
                  mode="date"
                  onChange={onChange}
                  style={{ height: 150 }}
                  maximumDate={tenYearsAgo}
                />
              )}

              <View className="my-2 w-full">
                <Text className="text-lg font-JakartaSemiBold mb-3">
                  Location
                </Text>
                <View className="flex flex-row justify-start items-center relative bg-neutral-100 rounded-full border border-neutral-100 focus:border-primary-500 ">
                  <Pressable onPress={handleNavigateToCountry}>
                    <TextInput
                      className="rounded-full p-4 font-JakartaSemiBold text-[15px] flex-1 text-left"
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
                  className="my-5 "
                  disabled={
                    !form.firstName ||
                    !form.lastName ||
                    !dateOfBirth ||
                    !form.userLocation
                  }
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

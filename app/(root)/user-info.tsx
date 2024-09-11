import { useUser } from "@clerk/clerk-expo";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useState } from "react";
import {
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
import { fetchAPI } from "@/lib/fetch";
import { calculateAge, formatDate } from "@/lib/utils";

const UserInfo = () => {
  const { user } = useUser();

  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

  const [date, setDate] = useState(tenYearsAgo);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    userLocation: "",
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

  const handleGetStarted = async () => {
    const age = calculateAge(date);

    if (age < 13) {
      Alert.alert(
        "Age Restriction",
        "You must be over 13 years old to use this app."
      );
      return;
    }

    await fetchAPI("/(api)/info", {
      method: "POST",
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: dateOfBirth,
        userLocation: form.userLocation,
        clerkId: user!.id,
      }),
    });

    router.push("/(root)/(tabs)/home");
  };

  return (
    <SafeAreaView className="flex-1">
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

            <View className="my-2 w-full">
              <Text className="text-lg font-JakartaSemiBold mb-3">
                Date of Birth
              </Text>
              <View className="flex flex-row justify-start items-center relative bg-neutral-100 rounded-full border border-neutral-100 focus:border-primary-500 ">
                <Pressable onPress={toggleDatePicker}>
                  <TextInput
                    className="rounded-full p-4 font-JakartaSemiBold text-[15px] flex-1 text-left"
                    placeholder="MM/DD/YYYY"
                    // placeholderTextColor="#c0c0c0"
                    value={dateOfBirth}
                    onChangeText={setDateOfBirth}
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
                <Pressable onPress={() => router.push("/(root)/country")}>
                  <TextInput
                    className="rounded-full p-4 font-JakartaSemiBold text-[15px] flex-1 text-left"
                    placeholder="Your Location"
                    // placeholderTextColor="#c0c0c0"
                    value={form.userLocation}
                    // TODO: onChangeText
                    editable={false}
                    onPressIn={() => router.push("/(root)/country")}
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
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserInfo;

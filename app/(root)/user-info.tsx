import { useUser } from "@clerk/clerk-expo";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";

const UserInfo = () => {
  const { user } = useUser();

  const [date, setDate] = useState(new Date());
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const toggleDatePicker = () => {
    setShowPicker(!showPicker);
  };

  const onChange = (event: any, selectedDate: any) => {
    if (selectedDate) {
      const currentDate = selectedDate;
      setDate(currentDate);

      if (Platform.OS === "android") {
        toggleDatePicker();
        setDateOfBirth(currentDate.toDateString());
      }
    } else {
      toggleDatePicker();
    }
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
              placeholder={user?.firstName || "Your First Name"}
              containerStyle="w-full"
              inputStyle="p-3.5"
              editable={true}
            />

            <InputField
              label="Last name"
              placeholder={user?.lastName || "Your Last Name"}
              containerStyle="w-full"
              inputStyle="p-3.5"
              editable={true}
            />

            {showPicker && (
              <DateTimePicker
                mode="date"
                display="spinner"
                value={date}
                onChange={onChange}
                style={{ height: 120, marginTop: -10 }}
              />
            )}

            {showPicker && Platform.OS === "ios" && (
              <View className="row justify-around">
                <TouchableOpacity onPress={toggleDatePicker}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {!showPicker && (
              <Pressable onPress={toggleDatePicker}>
                <InputField
                  label="Date of Birth"
                  placeholder="Your Birthday"
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  containerStyle="w-full"
                  inputStyle="p-3.5"
                  editable={false}
                />
              </Pressable>
            )}

            <CustomButton
              title="Get Started"
              onPress={() => {
                router.push("/(root)/(tabs)/home");
              }}
              className="mt-5"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserInfo;

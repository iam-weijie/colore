import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";

const UserInfo = () => {
  const { user } = useUser();
  // TO DO: instead of clerk, should user the user data from google login.

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

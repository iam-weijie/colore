import { useUser } from "@clerk/clerk-expo";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import InputField from "@/components/InputField";

const UserInfo = () => {
  const { user } = useUser();

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text className="text-2xl font-JakartaBold my-5">
          Welcome to Driftn 🌊
        </Text>

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
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserInfo;

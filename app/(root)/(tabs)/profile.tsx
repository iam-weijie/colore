import { icons } from "@/constants/index";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useAuth();

  // TODO: get user location from neon
  const [userLocation, setUserLocation] = useState("Montreal");

  // TODO: Replace with user info fetched from neon
  const [form, setForm] = useState({
    firstName: user?.firstName || "J. Doe",
  });

  const handleSignOut = async () => {
    signOut();
    router.replace("/(auth)/log-in");
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="flex flex-row items-center justify-between">
          <TextInput
            className="text-2xl font-JakartaBold my-5"
            value={form.firstName}
            onChangeText={(value) => setForm({ ...form, firstName: value })}
          />

          <TouchableOpacity onPress={handleSignOut}>
            <Image source={icons.logout} className="w-5 h-5" />
          </TouchableOpacity>
        </View>

        <View>
          <Pressable onPress={() => router.push("/(root)/country")}>
            <TextInput
              className="text-base my-1"
              value={`📍${userLocation}`}
              editable={false}
              onPressIn={() => router.push("/(root)/country")}
            />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

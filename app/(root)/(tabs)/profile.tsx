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

  const [showDropdown, setShowDropdown] = useState(false);
  const [userLocation, setUserLocation] = useState("Montreal");

  // TO DO: Replace with user info fetched from neon
  const [form, setForm] = useState({
    firstName: user?.firstName || "J. Doe",
  });

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    setUserLocation("Montreal");
  };

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
          <Pressable onPress={() => router.push("/(root)/user-info")}>
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

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
import { useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigationContext } from "@/components/NavigationContext";

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { stateVars, setStateVars } = useNavigationContext();
  const route = useRoute();
  const currentScreen = route.name as string;

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

  const handleNavigateToCountry = () => {
    setStateVars({
      ...stateVars,
      previousScreen: currentScreen,
    });
    router.push("/(root)/country");
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
          <Pressable onPress={handleNavigateToCountry}>
            <TextInput
              className="text-base my-1"
              value={`📍${userLocation}`}
              editable={false}
              onPressIn={handleNavigateToCountry}
            />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

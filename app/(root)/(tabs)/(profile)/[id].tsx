import { icons } from "@/constants/index";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useState, useEffect } from "react";
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
import { fetchAPI } from "@/lib/fetch";

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { stateVars, setStateVars } = useNavigationContext();
  const route = useRoute();
  const currentScreen = route.name as string;
  const [userLocation, setUserLocation] = useState("Montreal");
  const [form, setForm] = useState({
    firstName: user?.firstName || "J. Doe",
  });

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

  const fetchUserData = async (userId: string) => {
    try {
      const response = await fetchAPI(`/(api)/(user)/getinfo?id=${userId}`, {
        method: "GET",
      });
      if (response.error) {
        throw new Error(response.error);
      }
      console.log(response.data);
      setForm({
        firstName: response.data.firstname,
      });
      setUserLocation(response.data.country || "No country selected");
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserData(user.id);
    }
  }, [user]);

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

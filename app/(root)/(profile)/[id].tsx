import { icons } from "@/constants/index";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import {
  Image,
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchAPI } from "@/lib/fetch";

interface UserProfile {
  city: string;
  clerk_id: string;
  country: string;
  date_of_birth: string; // You can use `Date` type if you want to handle it as a date object.
  email: string;
  firstname: string;
  id: number;
  is_paid_user: boolean;
  lastname: string;
  report_count: number;
  state: string;
}

const Profile = () => {
  const { id } = useLocalSearchParams(); // get id of profile
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);

  const fetchUserData = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAPI(`/(api)/(user)/getinfo?id=${userId}`, {
        method: "GET",
      });
      if (response.error) {
        throw new Error(response.error);
      }
      const profile = response.data as UserProfile;
      setProfileUser(profile);
    } catch (error) {
      setError("Failed to fetch user data.");
      console.error("Failed to fetch user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const profileId = String(id); // to prevent TS from complaining
    if (profileId) {
      fetchUserData(profileId);
    }
  }, [id]);

  const router = useRouter();

  const navigateToHome = () => {
    router.push("/(root)/(tabs)/home"); // Adjust the path based on your home page route
  };

  return (
    <SafeAreaView className="flex-1">
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text>{error}</Text>
      ) : (
        <ScrollView
          className="px-5"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="flex flex-row items-center ">
            <TouchableOpacity onPress={navigateToHome}>
              <Image source={icons.back} className="w-5 h-5" />
            </TouchableOpacity>

            <Text className="text-2xl font-JakartaBold my-5 left-2">
              {profileUser?.firstname?.charAt(0)}.
            </Text>
          </View>

          <View>
            <Text className="text-base my-1">
              📍{profileUser?.city}, {profileUser?.state},{" "}
              {profileUser?.country}
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Profile;

import { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchAPI } from "@/lib/fetch";
import { icons } from "@/constants/index";
import { useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useNavigationContext } from "@/components/NavigationContext";
import UserPostsGallery from "@/components/PostGallery";

interface UserProfile {
  city: string;
  clerk_id: string;
  country: string;
  date_of_birth: string;
  email: string;
  firstname: string;
  id: number;
  is_paid_user: boolean;
  lastname: string;
  report_count: number;
  state: string;
}

interface Props {
  userId: string;
  isEditable: boolean;
  onSignOut?: () => void;
}

const UserProfileComponent: React.FC<Props> = ({
  userId,
  isEditable,
  onSignOut,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const { stateVars, setStateVars } = useNavigationContext();
  const route = useRoute();
  const router = useRouter();
  const currentScreen = route.name as string;

  const handleNavigateToCountry = () => {
    setStateVars({
      ...stateVars,
      previousScreen: currentScreen,
    });
    router.push("/(root)/country");
  };

  useEffect(() => {
    const fetchUserData = async () => {
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
    fetchUserData();
  }, [userId]);

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (error) return <Text>{error}</Text>;

  return (
    <SafeAreaView className="flex-1">
      <View className="px-5" contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="flex flex-row items-center justify-between">
          {!isEditable && (
            <TouchableOpacity
              onPress={() => router.push("/(root)/(tabs)/home")}
            >
              <Image
                source={icons.back}
                tintColor="#0076e3"
                className="w-5 h-5"
              />
            </TouchableOpacity>
          )}
          {/* <Text
            className={`text-2xl font-JakartaBold my-5 ${!isEditable ? "ml-2" : ""} flex-1`}
          >
            {isEditable
              ? `${profileUser?.firstname} ${profileUser?.lastname}`
              : `${profileUser?.firstname.charAt(0)}.`}
          </Text> */}
          <Text
            className={`text-2xl font-JakartaBold my-5 ${!isEditable ? "ml-2" : ""} flex-1`}
          >
            {profileUser?.firstname.charAt(0)}.
          </Text>
          {isEditable && onSignOut && (
            <TouchableOpacity onPress={onSignOut}>
              <Image source={icons.logout} className="w-5 h-5" />
            </TouchableOpacity>
          )}
        </View>

        <View>
          <Pressable disabled={!isEditable} onPress={handleNavigateToCountry}>
            <TextInput
              className="text-base my-1"
              value={`📍${profileUser?.city}, ${profileUser?.state}, ${profileUser?.country}`}
              editable={false}
            />
          </Pressable>
        </View>
      </View>
      <UserPostsGallery userId={userId} />
    </SafeAreaView>
  );
};

export default UserProfileComponent;

import { useState, useEffect } from "react";
import {
  ScrollView,
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
import { useRouter } from "expo-router";

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
  currentUserId?: string;
  userId: string;
  onSignOut?: () => void; // Optional
}

const UserProfileComponent: React.FC<Props> = ({
  userId,
  currentUserId,
  onSignOut,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [isEditable, setIsEditable] = useState(false);
  const router = useRouter();

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
        setIsEditable(currentUserId === profile.clerk_id); // only allow users to edit their own profile
      } catch (error) {
        setError("Failed to fetch user data.");
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId, currentUserId]);

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (error) return <Text>{error}</Text>;

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="flex flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.push("/(root)/(tabs)/home")}>
            <Image
              source={icons.back}
              tintColor="#0076e3"
              className="w-5 h-5"
            />
          </TouchableOpacity>
          <Text
            className={`text-2xl font-JakartaBold my-5 ${!isEditable ? "ml-2" : ""}`}
          >
            {isEditable
              ? `${profileUser?.firstname} ${profileUser?.lastname}`
              : `${profileUser?.firstname.charAt(0)}.`}
          </Text>
          {isEditable && onSignOut && (
            <TouchableOpacity onPress={onSignOut}>
              <Image source={icons.logout} className="w-5 h-5" />
            </TouchableOpacity>
          )}
        </View>

        <View>
          <Pressable disabled={!isEditable}>
            <TextInput
              className="text-base my-1"
              value={`📍${profileUser?.city}, ${profileUser?.state}, ${profileUser?.country}`}
              editable={isEditable}
            />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserProfileComponent;

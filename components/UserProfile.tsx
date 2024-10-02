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
import PostGallery from "@/components/PostGallery";
import { Post } from "@/types/type";

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

interface UserData {
  userInfo: UserProfile;
  posts: Post[];
}

interface Props {
  userId: string;
  isEditable: boolean;
  onSignOut?: () => void;
}

const UserProfile: React.FC<Props> = ({
  userId,
  isEditable,
  onSignOut,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const { stateVars, setStateVars } = useNavigationContext();
  const route = useRoute();
  const router = useRouter();
  const currentScreen = route.name as string;

  const handleNavigateToCountry = () => {
    setStateVars({
      ...stateVars,
      previousScreen: currentScreen,
    });
    router.push("/(root)/(location)/country");
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchAPI(`/(api)/(users)/getUserInfoPosts?id=${userId}`, {
          method: "GET",
        });
        if (response.error) {
          throw new Error(response.error);
        }
        const { userInfo, posts } = response as UserData;
        setProfileUser(userInfo);
        setUserPosts(posts);
      } catch (error) {
        setError("Failed to fetch user data.");
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId]);

  if (loading) return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    </SafeAreaView>
  );
  
  if (error) return (
    <SafeAreaView className="flex-1">
      <View className="flex flex-row items-center justify-between">
        <Text>An error occurred</Text>
      </View>
    </SafeAreaView>
  );

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
          <Text
            className={`text-2xl font-JakartaBold ${!isEditable ? "ml-2" : ""} flex-1`}
          >
            {profileUser?.firstname.charAt(0)}.
          </Text>
          {isEditable && onSignOut && (
            <TouchableOpacity onPress={onSignOut}>
              <Image source={icons.logout} className="w-5 h-5"/>
            </TouchableOpacity>
          )}
        </View>

        <View>
          <Pressable disabled={!isEditable} onPress={handleNavigateToCountry}>
            <TextInput
              className="text-base my-1"
              value={`📍${profileUser?.city}, ${profileUser?.state}, ${profileUser?.country}`}
              editable={false}
              onPressIn={handleNavigateToCountry}
            />
          </Pressable>
        </View>
      </View>
      <PostGallery posts={userPosts} /> 
    </SafeAreaView>
  );
};

export default UserProfile;

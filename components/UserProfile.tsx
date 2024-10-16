import { useNavigationContext } from "@/components/NavigationContext";
import CustomButton from "@/components/CustomButton";
import PostGallery from "@/components/PostGallery";
import { icons } from "@/constants/index";
import { fetchAPI } from "@/lib/fetch";
import {
  Post,
  UserData,
  UserProfileProps,
  UserProfileType,
} from "@/types/type";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";

const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  isEditable,
  onSignOut,
}) => {
  type UserNicknamePair = [string, string];
  const { user } = useUser();
  const [nickname, setNickname] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<UserProfileType | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const { stateVars, setStateVars } = useNavigationContext();
  const route = useRoute();
  const router = useRouter();
  const currentScreen = route.name as string;
  
  function findUserNickname(userArray: UserNicknamePair[], userId: string): number {
    const index = userArray.findIndex(pair => pair[0] === userId);
    return index;
  }

  const fetchCurrentNickname = async () => {
    try {
        console.log("user: ", user!.id);
        const response = await fetchAPI(
          `/(api)/(users)/getUserInfo?id=${user!.id}`,
          {
            method: "GET",
          }
        );
        if (response.error) {
          console.log("Error fetching user data");
          console.log("response data: ", response.data);
          console.log("response status: ", response.status);
          console.log("response: ", response);
          throw new Error(response.error);
        }
        console.log("response: ", response.data[0].nicknames);
        const nicknames = response.data[0].nicknames || [];
        return findUserNickname(nicknames, userId) === -1 ? "" : nicknames[findUserNickname(nicknames, userId)][1];
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
    useEffect(() => {
        const getData = async () => {
            const data = await fetchCurrentNickname();
            setNickname(data);
          };
          getData();
    }, [stateVars]);

  const handleNavigateToCountry = () => {
    if (isEditable) {
      setStateVars({
        ...stateVars,
        previousScreen: currentScreen,
      });
      router.push("/(root)/(location)/country");
    }
  };

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAPI(
        `/(api)/(users)/getUserInfoPosts?id=${userId}`,
        {
          method: "GET",
        }
      );
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

  const handleAddNickname = () => {
    console.log("Add Nickname button was pressed:");
    setStateVars({
      ...stateVars,
      previousScreen: currentScreen,
      userId,
    });
    router.push("/(root)/(profile)/nickname");
  };


  useEffect(() => {
    fetchUserData();
  }, [userId]);

  if (loading)
    return (
      <View className="flex-[0.8] justify-center items-center">
        <ActivityIndicator size="large" color="black" />
      </View>
    );

  if (error)
    return (
      <SafeAreaView className="flex-1">
        <View className="flex flex-row items-center justify-between">
          <Text>An error occurred. Please try again Later.</Text>
        </View>
      </SafeAreaView>
    );

  return (
    <View className="flex-1 mt-3">
      <View className="mx-7 mb-7">
        <View className="flex flex-row items-center justify-between">
          {!isEditable && (
            <View>
              <TouchableOpacity onPress={() => router.back()}>
                <AntDesign name="caretleft" size={18} color="0076e3" />
              </TouchableOpacity>
            </View>
          )}
          <Text className={`text-2xl font-JakartaBold flex-1`}>
            {nickname ? nickname : `${profileUser?.firstname?.charAt(0)}.`}
          </Text>

          <View className="flex flex-row items-center">
            {!isEditable && (
              <CustomButton
                title="Nickname"
                onPress={handleAddNickname}
                className="mr-3 w-[100px] h-11 rounded-md"
                fontSize="sm"
                padding="2"
              />
            )}
          </View>
          {isEditable && onSignOut && (
            <TouchableOpacity onPress={onSignOut}>
              <Image source={icons.logout} className="w-5 h-5" />
            </TouchableOpacity>
          )}
        </View>

        <View>
          <Pressable disabled={!isEditable} onPress={handleNavigateToCountry}>
            <TextInput
              className="text-base mt-3"
              value={`📍${profileUser?.city}, ${profileUser?.state}, ${profileUser?.country}`}
              editable={false}
              onPressIn={handleNavigateToCountry}
            />
          </Pressable>
        </View>
      </View>
      <View className="flex-grow items-center">
        <PostGallery posts={userPosts} handleUpdate={fetchUserData} />
      </View>
    </View>
  );
};

export default UserProfile;

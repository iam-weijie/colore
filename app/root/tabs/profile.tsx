import UserProfile from "@/components/UserProfile";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { SafeAreaView, View } from "react-native";

const Profile = () => {
  const { signOut } = useAuth();
  const { user } = useUser();

  const handleSignOut = async () => {
    signOut();
    router.replace("/auth/log-in");
  };

  return (
    <View className="flex-1">
      {user && <UserProfile userId={user?.id} onSignOut={handleSignOut} />}
      </View>
  );
};

export default Profile;

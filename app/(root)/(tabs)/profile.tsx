import { useAuth, useUser } from "@clerk/clerk-expo";
import UserProfile from "@/components/UserProfile"; 
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const Profile = () => {
  const { signOut } = useAuth();
  const { user } = useUser();

  const handleSignOut = async () => {
    signOut();
    router.replace("/(auth)/log-in");
  };

  return (
    <SafeAreaView className="flex-1">
      {user && (
        <UserProfile userId={user?.id} isEditable={true} onSignOut={handleSignOut} />
      )}
    </SafeAreaView>
  );
};

export default Profile;

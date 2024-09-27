import UserProfile from "@/components/UserProfile";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

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
        <UserProfile
          userId={user?.id}
          isEditable={true}
          onSignOut={handleSignOut}
        />
      )}
    </SafeAreaView>
  );
};

export default Profile;

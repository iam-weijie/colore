import { useAuth, useUser } from "@clerk/clerk-expo";
import UserProfile from "@/components/UserProfile"; // Import the new component
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  const { signOut } = useAuth();
  const { user } = useUser();

  return (
    <SafeAreaView className="flex-1">
      {user && (
        <UserProfile
          userId={user?.id}
          currentUserId={user?.id}
          onSignOut={signOut}
        />
      )}
    </SafeAreaView>
  );
};

export default Profile;

import { useLocalSearchParams } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import UserProfile from "@/components/UserProfile"; // Import the new component
import { SafeAreaView } from "react-native-safe-area-context";

// note: this is currently duplicate code with the user's own profile page
// they are in different files because the routing is different to both

// the own profile page file is routed to by the tab bar at the bottom of the app
// and the other user's profile page file is routed to from (profile)

// could possibly separate out more code here
const Profile = () => {
  const { id } = useLocalSearchParams();
  const { signOut } = useAuth();
  const { user } = useUser();

  return (
    <SafeAreaView className="flex-1">
      {user && id && (
        <UserProfile
          userId={id as string}
          currentUserId={user?.id}
          onSignOut={signOut}
        />
      )}
    </SafeAreaView>
  );
};

export default Profile;

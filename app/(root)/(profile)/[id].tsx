import { useLocalSearchParams } from "expo-router";
import UserProfile from "@/components/UserProfile";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView className="flex-1">
      {id && (
        <UserProfile
          userId={id as string}
          isEditable={false}
        />
      )}
    </SafeAreaView>
  );
};

export default Profile;

import { SignedIn, useUser } from "@clerk/clerk-expo";
import { Text, Button, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "@/components/CustomButton";

export default function Page() {
  const { user } = useUser();

  const handleNewPostPress = () => {
    router.push("/(root)/new-post");
  };

  return (
    <SafeAreaView>
      <SignedIn>
        <Text>Hello {user?.emailAddresses[0].emailAddress}</Text>
        <Button title="New Post" onPress={handleNewPostPress} />
      </SignedIn>
    </SafeAreaView>
  );
};
import { icons } from "@/constants/index";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useAuth();

  const [name, setName] = useState(user?.firstName || "J. Doe");
  const [isEditing, setIsEditing] = useState(false);

  const handleSignOut = async () => {
    signOut();
    router.replace("/(auth)/log-in");
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="flex flex-row items-center justify-between">
          {isEditing ? (
            <TextInput
              className="text-2xl font-JakartaBold my-5"
              placeholder={name}
              onChangeText={setName}
              onBlur={() => setIsEditing(false)}
              autoFocus
            />
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text className="text-2xl font-JakartaBold my-5">{name}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={handleSignOut}>
            <Image source={icons.logout} className="w-5 h-5" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

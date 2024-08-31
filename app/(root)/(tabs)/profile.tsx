import { useUser } from "@clerk/clerk-expo";
import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  const { user } = useUser();

  const [name, setName] = useState(user?.firstName || "J. Doe");
  const [isEditing, setIsEditing] = useState(false);

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

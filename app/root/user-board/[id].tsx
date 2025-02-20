import { SafeAreaView, View, TouchableOpacity, Text, Image } from "react-native";
import PersonalBoard from "@/components/PersonalBoard";
import { AntDesign } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { icons } from "@/constants";
import { router } from "expo-router";


const UserPersonalBoard = () => {
  const { id, username } = useLocalSearchParams();
  
    const handleNewPost = () => { 
      router.push({
        pathname: "/root/new-personal-post",
        params: { 
          recipient_id: id,
          source: 'board'
        }
      });
    };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-row justify-between items-center mx-7 mt-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <AntDesign name="caretleft" size={18} />
        </TouchableOpacity>

        <Text className="text-xl font-JakartaBold">
          {username}'s Board
        </Text>

        <TouchableOpacity onPress={handleNewPost}>
          <Image source={icons.pencil} className="w-7 h-7" />
        </TouchableOpacity>
      </View>
      <PersonalBoard userId={id as string} />
    </SafeAreaView>
  );
};

export default UserPersonalBoard;

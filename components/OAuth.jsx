import { Text, View } from "react-native";

const OAuth = () => {
  return (
    <View className="flex flex-row justify-center items-center mt-4 gap-x-3">
      <View className="flex-1 h-[0.5px] bg-gray-500" />
      <Text className="text-lg mx-2">Or</Text>
      <View className="flex-1 h-[0.5px] bg-gray-500" />
    </View>
  );
};

export default OAuth;

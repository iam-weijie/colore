import { SafeAreaView, StatusBar, Text } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <Text className="text-red-500">Dritn</Text>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

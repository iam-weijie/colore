import { countries } from "@/constants/index";
import { router } from "expo-router";
import { FlatList, ScrollView, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const country = () => {
  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="px-5">
        <Text>Select a Country</Text>
        <FlatList
          data={countries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(root)/state",
                  params: { country: item.name },
                })
              }
            >
              <Text>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default country;

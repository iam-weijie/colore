import { countries } from "@/constants/index";
import { router, useLocalSearchParams } from "expo-router";
import { FlatList, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Country = () => {
  const { previousScreen } = useLocalSearchParams();

  return (
    <SafeAreaView className="flex-1">
      <Text className="text-lg font-JakartaSemiBold m-3">Select a Country</Text>
      <FlatList
        data={countries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/root/location/state",
                params: { country: item.name, previousScreen },
              })
            }
          >
            <Text className="font-JakartaSemiBold text-[15px] ml-3 my-2">
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default Country;

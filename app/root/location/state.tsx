import { countries } from "@/constants/index";
import { router, useLocalSearchParams } from "expo-router";
import { FlatList, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const State = () => {
  const { country, previousScreen } = useLocalSearchParams();

  const selectedCountry = countries.find((c) => c.name === country);
  const states = selectedCountry ? selectedCountry.states : [];

  return (
    <SafeAreaView className="flex-1">
      <Text className="text-lg font-JakartaSemiBold m-3">
        Select a State in {country}
      </Text>
      <FlatList
        data={states}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/root/location/city",
                params: { state: item.name, country, previousScreen },
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

export default State;

import { countries } from "@/constants/index";
import { router, useLocalSearchParams } from "expo-router";
import { FlatList, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const State = () => {
  const { country } = useLocalSearchParams();

  const selectedCountry = countries.find((c) => c.name === country);
  const states = selectedCountry ? selectedCountry.states : [];

  return (
    <SafeAreaView>
      <Text>Select a State in {country}</Text>
      <FlatList
        data={states}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(root)/city",
                params: { state: item.name, country },
              })
            }
          >
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default State;

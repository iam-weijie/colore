import { countries } from "@/constants/index";
import { useLocalSearchParams } from "expo-router";
import { FlatList, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const City = () => {
  const { state, country } = useLocalSearchParams();

  const selectedCountry = countries.find((c) => c.name === country);
  const selectedState = selectedCountry?.states.find((s) => s.name === state);
  const cities = selectedState ? selectedState.cities : [];

  return (
    <SafeAreaView>
      <Text>Select a City in {state}</Text>
      <FlatList
        data={cities}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
          // TODO: store the selected info to db
          // onPress={() =>

          //     params: { city: item, state, country },
          //   })
          >
            <Text>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default City;

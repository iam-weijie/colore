import { countries } from "@/constants/index";
import { useLocalSearchParams } from "expo-router";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

const city = () => {
  const { state, country } = useLocalSearchParams(); // Get selected state and country from route params

  const selectedCountry = countries.find((c) => c.name === country);
  const selectedState = selectedCountry?.states.find((s) => s.name === state);
  const cities = selectedState ? selectedState.cities : [];

  return (
    <View>
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
    </View>
  );
};

export default city;

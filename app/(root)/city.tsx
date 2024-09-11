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
    <SafeAreaView className="flex-1">
      <Text className="text-lg font-JakartaSemiBold m-3">
        Select a City in {state}
      </Text>
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
            <Text className="font-JakartaSemiBold text-[15px] ml-3 my-2">
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default City;

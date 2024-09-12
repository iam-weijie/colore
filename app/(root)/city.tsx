import { countries } from "@/constants/index";
import { router, useLocalSearchParams, Href } from "expo-router";
import { useState } from "react";
import { FlatList, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigationContext } from "../../components/NavigationContext";

const City = () => {
  const { stateVars } = useNavigationContext();
  const { state, country } = useLocalSearchParams();

  const selectedCountry = countries.find((c) => c.name === country);
  const selectedState = selectedCountry?.states.find((s) => s.name === state);
  const cities = selectedState ? selectedState.cities : [];

  const [selectedCity, setSelectedCity] = useState("");

  const handleCityPress = (city: string) => {
    setSelectedCity(city);
  };

  const handleConfirmPress = () => {
    router.replace(`/(root)/${stateVars.previousScreen}` as Href<string>);
  };
  return (
    <SafeAreaView className="flex-1">
      <Text className="text-lg font-JakartaSemiBold m-3">
        Select a City in {state}
      </Text>
      <FlatList
        data={cities}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleCityPress(item)}>
            <Text className="font-JakartaSemiBold text-[15px] ml-3 my-2">
              {item}
            </Text>

            {selectedCity === item && (
              <Text className="absolute text-lg my-1 mx-3 right-0">✓</Text>
            )}
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        onPress={
          handleConfirmPress
          // TODO: pass the following info to the previous screen
          //     params: { city: item, state, country }
        }
        className="absolute top-14 right-4 p-2 rounded-lg  bg-primary-500"
      >
        <Text className="text-white">Done</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default City;

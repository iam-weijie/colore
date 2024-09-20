import { countries } from "@/constants/index";
import { Href, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigationContext } from "../../components/NavigationContext";
import { fetchAPI } from "@/lib/fetch";
import { useUser } from "@clerk/clerk-expo";

const City = () => {
  const { user } = useUser();
  const { stateVars, setStateVars } = useNavigationContext();
  const { state, country } = useLocalSearchParams();

  const selectedCountry = countries.find((c) => c.name === country);
  const selectedState = selectedCountry?.states.find((s) => s.name === state);
  const cities = selectedState ? selectedState.cities : [];

  const [selectedCity, setSelectedCity] = useState("");

  const handleCityPress = (city: string) => {
    setSelectedCity(city);
  };
  const handleConfirmPress = async () => {
    setStateVars({
      ...stateVars,
      city: selectedCity,
      state: state,
      country: country,
      userLocation: `${selectedCity}, ${state}, ${country}`,
    });

    try {
      // Send PATCH request to update user location in the database
      const response = await fetch("/(api)/(user)/updateuser", {
        method: "PATCH",
        body: JSON.stringify({
          city: selectedCity,
          state: state,
          country: country,
          clerkId: user!.id, // assuming clerkId is stored in stateVars
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user location");
      }

      const data = await response.json();
      console.log("Location updated successfully:", data);
      router.replace(`/(root)/${stateVars.previousScreen}` as Href<string>);
    } catch (error) {
      console.error("Error updating location:", error);
    }
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
        onPress={handleConfirmPress}
        disabled={!selectedCity}
        className={`absolute top-14 right-4 p-2 rounded-lg ${
          selectedCity ? "bg-primary-500" : "bg-gray-300"
        }`}
      >
        <Text className="text-white">Done</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default City;

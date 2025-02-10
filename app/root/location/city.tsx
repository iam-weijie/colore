import { useEffect, useState } from "react";
import CustomButton from "@/components/CustomButton";
import { useNavigationContext } from "@/components/NavigationContext";
import { fetchAPI } from "@/lib/fetch";
import { useUser } from "@clerk/clerk-expo";
import { Href, router, useLocalSearchParams } from "expo-router";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Interface for City and State
interface City {
  name: string; // City name
}

interface State {
  name: string; // State name
  cities: City[]; // List of cities
}

const City = () => {
  const { user } = useUser();
  const { stateVars, setStateVars } = useNavigationContext();
  const { state, cities, country, previousScreen } = useLocalSearchParams();

  // Check if cities is a string, if so parse it; otherwise, assume it is already an array
  const cityData: City[] = typeof cities === "string" ? JSON.parse(cities) : cities || [];

  // Sort cities alphabetically
  const cityNames = cityData.map((city: City) => city.name);
  const sortedCities = cityNames.sort((a, b) => a.localeCompare(b));

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

    // Update user info
    await fetchAPI("/api/users/patchUserInfo", {
      method: "PATCH",
      body: JSON.stringify({
        clerkId: user!.id,
        country: country,
        state: state,
        city: selectedCity,
      }),
    });

    if (previousScreen === "settings") {
      router.push("/root/settings");
    } else {
      router.replace(`/${stateVars.previousScreen}` as Href);
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex flex-row justify-between items-center">
        <Text className="text-xl font-JakartaBold m-3">
          Select a City in {state}
        </Text>

        <CustomButton
          className="w-14 h-8 rounded-md mx-3"
          fontSize="sm"
          title="Done"
          padding="0"
          onPress={handleConfirmPress}
          disabled={!selectedCity}
        />
      </View>

      <FlatList
        data={sortedCities} // Use sorted cities
        keyExtractor={(item, index) => `${item}-${index}`}  // Using both city name and index to ensure uniqueness
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleCityPress(item)} 
           className="flex flex-row items-center justify-between px-4 relative h-[50px]"
          >
            <Text className="font-JakartaSemiBold text-[16px] ml-3 my-2">
              {item}
            </Text>

            {selectedCity === item && (
              <Text className="absolute text-lg my-1 mx-3 right-0">✓</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default City;

import { useEffect, useState, useCallback, memo, useMemo } from "react";
import CustomButton from "@/components/CustomButton";
import { useNavigationContext } from "@/components/NavigationContext";
import { fetchAPI } from "@/lib/fetch";
import { useUser } from "@clerk/clerk-expo";
import { Href, router, useLocalSearchParams } from "expo-router";
import { FlatList, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Interface for City and State
interface City {
  name: string; // City name
}

interface State {
  name: string; // State name
  cities: City[]; // List of cities
}

// Memoized city item component for better performance
const CityItem = memo(({ 
  cityName, 
  isSelected, 
  onPress 
}: { 
  cityName: string, 
  isSelected: boolean, 
  onPress: (city: string) => void 
}) => (
  <TouchableOpacity 
    onPress={() => onPress(cityName)} 
    className="flex flex-row items-center justify-between px-4 relative h-[50px]"
  >
    <Text className="font-JakartaSemiBold text-[16px] ml-3 my-2">
      {cityName}
    </Text>

    {isSelected && (
      <Text className="absolute text-lg my-1 mx-3 right-0">✓</Text>
    )}
  </TouchableOpacity>
));

const City = () => {
  const { user } = useUser();
  const { stateVars, setStateVars } = useNavigationContext();
  const { state, cities, country, previousScreen } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [sortedCities, setSortedCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("");

  // Process city data in a non-blocking way
  useEffect(() => {
    const processCityData = () => {
      try {
        // Check if cities is a string, if so parse it; otherwise, assume it is already an array
        const cityData: City[] = typeof cities === "string" ? JSON.parse(cities as string) : cities || [];
        
        // Get city names and sort them
        const cityNames = cityData.map((city: City) => city.name);
        const sorted = cityNames.sort((a: string, b: string) => a.localeCompare(b));
        
        setSortedCities(sorted);
      } catch (error) {
        console.error("Error processing city data:", error);
        setSortedCities([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Use setTimeout to move processing off the main thread
    setTimeout(processCityData, 0);
  }, [cities]);

  // Memoized functions
  const handleCityPress = useCallback((city: string) => {
    setSelectedCity(city);
  }, []);

  const handleConfirmPress = useCallback(async () => {
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
      router.replace("/root/settings");
    } else {
      router.replace(`/${stateVars.previousScreen}` as Href);
    }
  }, [selectedCity, state, country, stateVars, previousScreen, user]);

  // Memoized keyExtractor
  const keyExtractor = useCallback((item: string, index: number) => 
    `${item}-${index}`, []);

  // Memoized renderItem
  const renderItem = useCallback(({ item }: { item: string }) => (
    <CityItem 
      cityName={item} 
      isSelected={selectedCity === item}
      onPress={handleCityPress} 
    />
  ), [selectedCity, handleCityPress]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-4">Loading cities...</Text>
      </SafeAreaView>
    );
  }

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
        data={sortedCities}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => (
          {length: 50, offset: 50 * index, index}
        )}
      />
    </SafeAreaView>
  );
};

export default City;

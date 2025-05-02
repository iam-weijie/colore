import { useEffect, useState, useCallback, memo, useMemo } from "react";
import CustomButton from "@/components/CustomButton";
import { useNavigationContext } from "@/components/NavigationContext";
import { fetchAPI } from "@/lib/fetch";
import { useUser } from "@clerk/clerk-expo";
import { Href, router, useLocalSearchParams } from "expo-router";
import { FlatList, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScrollingText from "./ScrollingText";
import { generateAcronym, isNameTooLong } from "./cacheStore";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";

// Interface for City and State
interface City {
  name: string; // City name
}

interface State {
  name: string; // State name
  cities: City[]; // List of cities
}

// Static styles to replace className
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 12
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 12,
    fontFamily: 'JakartaBold',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 50,
    position: 'relative',
  },
  cityName: {
    fontFamily: 'JakartaSemiBold',
    fontSize: 16,
    marginLeft: 12,
  },
  cityNameText: {
    fontFamily: 'JakartaSemiBold',
    fontSize: 16,
    marginLeft: 12,
  },
  checkmark: {
    position: 'absolute',
    fontSize: 18,
    right: 0,
    marginVertical: 4,
    marginHorizontal: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'JakartaRegular',
  }
});

// Memoized city item component for better performance
const CityItem = memo(({ 
  cityName, 
  isSelected, 
  onPress 
}: { 
  cityName: string, 
  isSelected: boolean, 
  onPress: (city: string) => void 
}) => {
  const requiresScrolling = isNameTooLong(cityName, 15);
  
  return (
    <TouchableOpacity 
      onPress={() => onPress(cityName)} 
      style={styles.itemContainer}
    >
      {requiresScrolling ? (
        <ScrollingText
          text={cityName}
          style={styles.cityName}
          maxLength={15}
        />
      ) : (
        <Text style={styles.cityNameText}>
          {cityName}
        </Text>
      )}

      {isSelected && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );
});

const City = () => {
  const { user } = useUser();
  const { stateVars, setStateVars } = useNavigationContext();
  const { state, cities, country, previousScreen } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [sortedCities, setSortedCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("");

  // Format the state name in the title
  const formattedStateName = useCallback(() => {
    const stateStr = state as string || '';
    return isNameTooLong(stateStr) ? generateAcronym(stateStr) : stateStr;
  }, [state]);

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
    if (user!.id) {
    await fetchAPI("/api/users/patchUserInfo", {
      method: "PATCH",
      body: JSON.stringify({
        clerkId: user!.id,
        country: country,
        state: state,
        city: selectedCity,
      }),
    });
  }

    router.back();
    router.back();
    router.back();
    
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
      <SafeAreaView style={styles.container}>
        <View className="flex-1 items-center justify-center">
                <ColoreActivityIndicator text="Loading cities..." />
                </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Select a City in {formattedStateName()}
        </Text>

        <CustomButton
          className="w-16 rounded-[24px] bg-[#b8e1ff] p-2 shadow-none"
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

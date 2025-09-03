import { useEffect, useState, useCallback, memo, useMemo } from "react";
import CustomButton from "@/components/CustomButton";
import { useNavigationContext } from "@/components/NavigationContext";
import { fetchAPI } from "@/lib/fetch";
import { useUser } from "@clerk/clerk-expo";
import { Href, router, useLocalSearchParams } from "expo-router";
import { FlatList, Image, Text, TouchableOpacity, View, StyleSheet, TextInput } from "react-native";
import ScrollingText from "./ScrollingText";
import { generateAcronym, isNameTooLong } from "./cacheStore";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import React from "react";
import { icons } from "@/constants";
import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import { useBackgroundColor, useTextColor, useThemeColors } from "@/hooks/useTheme";

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
  const colors = useThemeColors()
  const textColor = useTextColor()

  return (
    <TouchableOpacity
              className="flex-row items-center justify-between  mx-6 py-6 px-6 bg-white my-1 rounded-[32px]"
              onPress={() => onPress(cityName)} 
              style={{
                backgroundColor: colors.surfaceSecondary
              }}
              activeOpacity={0.7}
            >
              <View  className="flex-1 flex-row items-center">
               
                  <Text 
                  className="text-base font-JakartaSemiBold max-w-[85%]"
                  style={{
                    color: textColor
                  }}>
                    {cityName}
                  </Text>
              
              </View>
             {isSelected && <Image
              source={icons.check}
              tintColor={"#22c722"}
              className="w-6 h-6"
              />}
            </TouchableOpacity>
  );
});

const City = () => {
  const { user } = useUser();
  const { stateVars, setStateVars } = useNavigationContext();
  const { state, cities, country, previousScreen } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [sortedCities, setSortedCities] = useState<string[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("");

   const [searchText, setSearchText] = useState<string>("");

   const backgroundColor = useBackgroundColor()
   const colors = useThemeColors()
   const textColor = useTextColor()
 

  // Format the state name in the title
  const formattedStateName = useCallback(() => {
    const stateStr = state as string || '';
    return isNameTooLong(stateStr) ? generateAcronym(stateStr) : stateStr;
  }, [state]);


  // Clear search
      const handleClearSearch = useCallback(() => {
        setSearchText("");
      }, []);

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
        setFilteredCities(sorted);
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

      // Filter countries based on search text
      useEffect(() => {
        if (sortedCities.length > 0) {
          if (searchText) {
            const filtered = sortedCities.filter(city => {
              const slider = searchText.length
              const beginningOfWord = city.slice(0, slider)
              if (beginningOfWord.toLowerCase().includes(searchText.toLowerCase())) return city
            }
             
            );
            setFilteredCities(filtered);
          } else {
            setFilteredCities(sortedCities)
          }
        }
      }, [cities, searchText]);

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
    await fetchAPI("/api/users/updateUserInfo", {
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
      <View style={styles.container}>
        <View className="flex-1 items-center justify-center">
                <ColoreActivityIndicator text="Loading cities..." />
                </View>
      </View>
    );
  }

  return (
       <View 
       className="flex-1"
       style={{
        backgroundColor: backgroundColor
       }}>
          <Header
            title={`Select a City in ${formattedStateName()}`}
              item={
      <View className=" w-full px-6 -pt-2 pb-2">
        <View 
        className="flex-row items-center rounded-[24px] px-4 h-12 "
        style={{
          backgroundColor: colors.surfaceSecondary
        }}>
          <Ionicons name="search" size={20} color={colors.surfaceSecondary} />
          <TextInput
            className="flex-1 ml-2 h-full text-base "
            placeholder="Search cities..."
            placeholderTextColor={colors.textSecondary}
            style={{
              color: colors.textSecondary
            }}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchText.length > 0 && (
            <TouchableOpacity 
              onPress={handleClearSearch}
              className="w-6 h-6 items-center justify-center"
            >
              <Ionicons name="close-circle" size={20} color={colors.surfaceSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      }
          />
    
      

      <FlatList
        data={filteredCities}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        contentContainerStyle={{ paddingTop: 16 }}
        getItemLayout={(data, index) => (
          {length: 50, offset: 50 * index, index}
        )}
      />

<View className="flex-1 absolute flex items-center w-full bottom-[10%]">
            <CustomButton
              className="w-[50%] h-16 rounded-full shadow-none bg-black"
              fontSize="lg"
              title={"Done"}
              padding={4}
              onPress={handleConfirmPress}
              disabled={!selectedCity}
            />
            </View>
    </View>
  );
};

export default City;

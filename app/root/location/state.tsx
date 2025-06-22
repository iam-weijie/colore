import { useEffect, useState, useCallback, memo } from "react";
import { router, useLocalSearchParams, Href } from "expo-router";
import { FlatList, Text, TouchableOpacity, View, Alert, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getStatesFromCache, generateAcronym, isNameTooLong } from "./cacheStore";
import { useUser } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import { useNavigationContext } from "@/components/NavigationContext";
import ScrollingText from "./ScrollingText";
import { useAlert } from '@/notifications/AlertContext';
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import React from "react";
import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";

// Define the State interface
interface State {
  name: string;
  cities: string[];  // List of cities in the state
}

// Filter by first letter
interface StateWithLetter extends State {
  firstLetter: string;
}

// Static styles to replace className


// Memoized state item component for better performance
const StateItem = memo(({ item, onPress }: { 
  item: StateWithLetter, 
  onPress: (item: State) => void 
}) => {
  const requiresScrolling = isNameTooLong(item.name, 15);
  
  return (
       <TouchableOpacity
          className="flex-row items-center justify-between  mx-6 py-6 px-6 bg-white my-1 rounded-[32px]"
          onPress={() => onPress(item)}
          activeOpacity={0.7}
        >
          <View  className="flex-1 flex-row items-center">
           
              <Text className="text-base font-JakartaSemiBold max-w-[85%]">
                {item.name}
              </Text>
          
          </View>
        </TouchableOpacity>
  );
});

const State = () => {
  const { user } = useUser();
  const { stateVars, setStateVars } = useNavigationContext();
  const { country, countryId, previousScreen } = useLocalSearchParams();
  const [states, setStates] = useState<StateWithLetter[]>([]);
  const [filteredStates, setFilteredStates] = useState<StateWithLetter[]>([]);
   const [placeholderCount, setPlaceholderCount] = useState<number>(50);
  const [searchText, setSearchText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  // Format the country name in the title
  const formattedCountryName = useCallback(() => {
    const countryStr = country as string || '';
    return isNameTooLong(countryStr) ? generateAcronym(countryStr) : countryStr;
  }, [country]);

  // Get states from the shared cache
  useEffect(() => {
    // Short timeout to let UI render first
    
      try {
        // Get states for this country from the shared cache
        const countryStates = getStatesFromCache(countryId as string);
        
        if (countryStates.length === 0) {
          console.warn("No states found for country:", countryId);
        }
        
        // Sort states alphabetically for better UX
        const sortedStates = [...countryStates].sort((a: State, b: State) => 
          a.name.localeCompare(b.name)
        );
        
        const processedStates = sortedStates.map((s) => {
          return {
          ...s,
          firstLetter: s.name.charAt(0).toUpperCase() 
        }})
        setStates(processedStates);
        setFilteredStates(processedStates)
      } catch (error) {
        console.error("Error loading states:", error);
      } finally {
        setLoading(false);
      }
   
  }, [countryId]);


    // Clear search
    const handleClearSearch = useCallback(() => {
      setSearchText("");
    }, []);
  // Direct submission handler for states with no cities
  const handleDirectSubmission = useCallback(async (stateName: string) => {
    try {
      // Update navigation context
      setStateVars({
        ...stateVars,
        city: stateName,  // Use state name as city when no city is available
        state: stateName,
        country: country as string,
        userLocation: `${stateName}, ${country}`,
      });

      // Update user info
      await fetchAPI("/api/users/patchUserInfo", {
        method: "PATCH",
        body: JSON.stringify({
          clerkId: user!.id,
          country: country,
          state: stateName,
          city: stateName,  // Use state name as city when no city is available
        }),
      });

      // Use router.back() to ensure we return to previous screen properly
      router.back();
      router.back();
      
    } catch (error) {
      console.error("Error saving location:", error);
      showAlert({
        title: 'Limit Error',
        message: `Failed to save your location. Please try again.`,
        type: 'ERROR',
        status: 'error',
      });
    }
  }, [country, stateVars, user, setStateVars]);

    // Filter states based on search text
    useEffect(() => {
      if (states.length > 0) {
        if (searchText) {
          const filtered = states.filter(state => 
            state.name.toLowerCase().includes(searchText.toLowerCase())
          );
          setFilteredStates(filtered);
          
          // Update available letters for the filtered list
          const letters: string[] = [];
          const indices: {[key: string]: number} = {};
          
          filtered.forEach((country, index) => {
            const letter = country.firstLetter;
            if (!letters.includes(letter)) {
              letters.push(letter);
              indices[letter] = index;
            }
          });
        }
      }
    }, [states, searchText]);

  // Memoized press handler
  const handleStatePress = useCallback((item: State) => {
    // Check if the state has cities
    if (!item.cities || item.cities.length === 0) {
      // If no cities, show confirmation and submit directly
      Alert.alert(
        "Confirm Location",
        `Set your location to ${item.name}, ${country}?`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Confirm",
            onPress: () => handleDirectSubmission(item.name)
          }
        ]
      );
    } else {
      // If has cities, navigate to city selection screen
      router.push({
        pathname: "/root/location/city",
        params: { 
          country: country, 
          countryId: countryId,
          state: item.name,
          cities: JSON.stringify(item.cities),
          previousScreen: previousScreen 
        }
      });
    }
  }, [country, countryId, previousScreen, handleDirectSubmission]);

  // Memoized keyExtractor - add index to ensure uniqueness
  const keyExtractor = useCallback((item: State, index: number) => 
    `${item.name}-${index}`, []
  );

  // Memoized renderItem
  const renderItem = useCallback(({ item }: { item: StateWithLetter }) => (
    <StateItem item={item} onPress={handleStatePress} />
  ), [handleStatePress]);

       const getPlaceholderData = useCallback(() => {
      if (states.length > 0 || placeholderCount === 0) {
        return filteredStates;
      }
      
      // Return an array of nulls with the size of placeholderCount
      return Array(placeholderCount).fill(null);
    }, [states.length, filteredStates, placeholderCount]);

  const displayData = getPlaceholderData();
  if (loading) {
    return (
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center">
            <ColoreActivityIndicator text="Summoning Bob..." />
        </View>
      </SafeAreaView>
    );
  }


    
  return (
    <View className="flex-1 bg-[#FAFAFA]">

      <Header
        title={`Select a State in ${formattedCountryName()}`}
        item={
      <View className=" w-full px-6 -pt-2 pb-2">
        <View className="flex-row items-center bg-white rounded-[24px] px-4 h-14 ">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 h-full text-base "
            placeholder="Search countries..."
            placeholderTextColor="#D1D1D1"
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
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      }
      />

      {states.length === 0 && placeholderCount > 0 ? (
        <View className="items-center justify-center mt-8">
          <Text className="text-base font-JakartaMedium text-gray-500">No states found for this country.</Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          contentContainerStyle={{ paddingTop: 16 }}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => (
            {length: 50, offset: 50 * index, index}
          )}
        />
      )}
    </View>
  );
};

export default State;

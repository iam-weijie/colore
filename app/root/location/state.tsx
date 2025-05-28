import { useEffect, useState, useCallback, memo } from "react";
import { router, useLocalSearchParams, Href } from "expo-router";
import { FlatList, Text, TouchableOpacity, View, Alert, StyleSheet } from "react-native";
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

// Define the State interface
interface State {
  name: string;
  cities: string[];  // List of cities in the state
}

// Static styles to replace className


// Memoized state item component for better performance
const StateItem = memo(({ item, onPress }: { 
  item: State, 
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
  const [statesList, setStatesList] = useState<State[]>([]);
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
    setTimeout(() => {
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
        
        setStatesList(sortedStates);
      } catch (error) {
        console.error("Error loading states:", error);
      } finally {
        setLoading(false);
      }
    }, 50);
  }, [countryId]);

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
  const renderItem = useCallback(({ item }: { item: State }) => (
    <StateItem item={item} onPress={handleStatePress} />
  ), [handleStatePress]);

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
        />

      {statesList.length === 0 ? (
        <Header
        title={`No states found for this country.`}
        />
      ) : (
        <FlatList
          data={statesList}
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

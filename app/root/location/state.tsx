import { useEffect, useState, useCallback, memo } from "react";
import { router, useLocalSearchParams, Href } from "expo-router";
import { FlatList, Text, TouchableOpacity, ActivityIndicator, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getStatesFromCache } from "./cacheStore";
import { useUser } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import { useNavigationContext } from "@/components/NavigationContext";

// Define the State interface
interface State {
  name: string;
  cities: string[];  // List of cities in the state
}

// Memoized state item component for better performance
const StateItem = memo(({ item, onPress }: { 
  item: State, 
  onPress: (item: State) => void 
}) => (
  <TouchableOpacity
    className="flex flex-row items-center justify-between px-4 relative h-[50px]"
    onPress={() => onPress(item)}
  >
    <Text className="font-JakartaSemiBold text-[16px] ml-3 my-2">
      {item.name}
    </Text>
    {item.cities.length === 0 && (
      <Text className="font-JakartaRegular text-[14px] text-gray-500 mr-3">
        State used as city
      </Text>
    )}
  </TouchableOpacity>
));

const State = () => {
  const { user } = useUser();
  const { stateVars, setStateVars } = useNavigationContext();
  const { country, countryId, previousScreen } = useLocalSearchParams();
  const [statesList, setStatesList] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);

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

      // Navigate back based on previous screen
      if (previousScreen === "settings") {
        router.replace("/root/settings");
      } else {
        router.replace(`/${stateVars.previousScreen}` as Href);
      }
    } catch (error) {
      console.error("Error saving location:", error);
      Alert.alert("Error", "Failed to save your location. Please try again.");
    }
  }, [country, stateVars, previousScreen, user, setStateVars]);

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
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="black" />
        <Text className="mt-4 font-JakartaRegular text-black">Loading states...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <Text className="text-xl font-JakartaBold m-3">
        Select a State in {country}
      </Text>

      {statesList.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text>No states found for this country.</Text>
        </View>
      ) : (
        <FlatList
          data={statesList}
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
      )}
    </SafeAreaView>
  );
};

export default State;

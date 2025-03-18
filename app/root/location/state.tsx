import { useEffect, useState, useCallback, memo } from "react";
import { router, useLocalSearchParams, Href } from "expo-router";
import { FlatList, Text, TouchableOpacity, ActivityIndicator, View, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getStatesFromCache, generateAcronym, isNameTooLong } from "./cacheStore";
import { useUser } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import { useNavigationContext } from "@/components/NavigationContext";
import ScrollingText from "./ScrollingText";

// Define the State interface
interface State {
  name: string;
  cities: string[];  // List of cities in the state
}

// Static styles to replace className
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  stateName: {
    fontFamily: 'JakartaSemiBold', 
    fontSize: 16, 
    marginLeft: 12,
  },
  stateNameText: {
    fontFamily: 'JakartaSemiBold', 
    fontSize: 16, 
    marginLeft: 12,
  },
  stateInfo: {
    fontFamily: 'JakartaRegular', 
    fontSize: 14, 
    color: '#6B7280', 
    marginRight: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'JakartaRegular',
    color: 'black',
  },
  noStatesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noStatesText: {
    fontFamily: 'JakartaRegular',
    fontSize: 16,
  }
});

// Memoized state item component for better performance
const StateItem = memo(({ item, onPress }: { 
  item: State, 
  onPress: (item: State) => void 
}) => {
  const requiresScrolling = isNameTooLong(item.name, 15);
  
  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => onPress(item)}
    >
      {requiresScrolling ? (
        <ScrollingText
          text={item.name}
          style={styles.stateName}
          maxLength={15}
        />
      ) : (
        <Text style={styles.stateNameText}>
          {item.name}
        </Text>
      )}
      {item.cities.length === 0 && (
        <Text style={styles.stateInfo}>
          State used as city
        </Text>
      )}
    </TouchableOpacity>
  );
});

const State = () => {
  const { user } = useUser();
  const { stateVars, setStateVars } = useNavigationContext();
  const { country, countryId, previousScreen } = useLocalSearchParams();
  const [statesList, setStatesList] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);

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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="black" />
          <Text style={styles.loadingText}>Loading states...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Select a State in {formattedCountryName()}
      </Text>

      {statesList.length === 0 ? (
        <View style={styles.noStatesContainer}>
          <Text style={styles.noStatesText}>No states found for this country.</Text>
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

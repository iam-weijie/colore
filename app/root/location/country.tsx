import { useEffect, useState, useCallback, memo, useRef } from "react";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { 
  FlatList, 
  Text, 
  TouchableOpacity, 
  View, 
  ActivityIndicator, 
  StyleSheet,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addStatesToCache, generateAcronym, isNameTooLong } from "./cacheStore";
import ScrollingText from "./ScrollingText";

// Define simpler interfaces for better performance
interface State {
  name: string;
  cities: string[];
}

interface Country {
  cca2: string;
  name: string;
  emoji: string;
  hasStates: boolean;
}

// Static styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: 'black',
    fontFamily: 'JakartaRegular',
    fontSize: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
  },
  countryNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginVertical: 8,
  },
  emoji: {
    fontSize: 16,
    marginRight: 8,
  },
  countryName: {
    fontFamily: 'JakartaSemiBold',
    fontSize: 16,
  },
  countryNameText: {
    fontFamily: 'JakartaSemiBold',
    fontSize: 16,
  },
  countryCode: {
    fontFamily: 'JakartaSemiBold',
    fontSize: 15,
    color: '#9ca3af',
    marginLeft: 12,
    marginVertical: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 12,
    fontFamily: 'JakartaBold',
  },
  safeArea: {
    flex: 1,
  }
});

// Simple non-animated country item component
const CountryItem = memo(({ 
  item, 
  onPress,
}: { 
  item: Country, 
  onPress: (cca2: string, name: string) => void,
}) => {
  // Pre-bind the handler to prevent recreating it in render
  const handlePress = useCallback(() => {
    onPress(item.cca2, item.name);
  }, [onPress, item.cca2, item.name]);
  
  const requiresScrolling = isNameTooLong(item.name, 15);

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.countryNameContainer}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        {requiresScrolling ? (
          <ScrollingText
            text={item.name}
            style={styles.countryName}
            maxLength={15}
          />
        ) : (
          <Text style={styles.countryNameText}>
            {item.name}
          </Text>
        )}
      </View>
      <Text style={styles.countryCode}>
        {item.cca2}
      </Text>
    </TouchableOpacity>
  );
});

// Simple loading component with no animations
const LoadingComponent = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color="#888888" />
      <Text style={styles.loadingText}>Loading countries...</Text>
    </View>
  );
};

const Country = () => {
  const { previousScreen } = useLocalSearchParams();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const batchSize = useRef(50);
  const itemHeight = 60;
  
  // Load countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get(
          "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries%2Bstates%2Bcities.json"
        );
        
        // Process in chunks
        let processedCountries: Country[] = [];
        
        const processChunk = (startIndex: number, data: any[]) => {
          const endIndex = Math.min(startIndex + batchSize.current, data.length);
          
          for (let i = startIndex; i < endIndex; i++) {
            const country = data[i];
            if (country.states && country.states.length > 0) {
              addStatesToCache(country.iso2, country.states);
              
              processedCountries.push({
                cca2: country.iso2,
                name: country.name || "Unknown",
                emoji: country.emoji || "",
                hasStates: true
              });
            }
          }
          
          if (endIndex < data.length) {
            setTimeout(() => processChunk(endIndex, data), 0);
          } else {
            processedCountries.sort((a, b) => a.name.localeCompare(b.name));
            setCountries(processedCountries);
            setLoading(false);
          }
        };
        
        processChunk(0, response.data);
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    };
    
    fetchCountries();
  }, []);
  
  // Handle country selection
  const handleCountryPress = useCallback((countryId: string, countryName: string) => {
    router.push({
      pathname: "/root/location/state",
      params: { 
        country: countryName, 
        countryId: countryId,
        previousScreen: previousScreen 
      }
    });
  }, [previousScreen]);
  
  // Optimized keyExtractor
  const keyExtractor = useCallback((item: Country) => item.cca2, []);
  
  // Simple renderItem without any animations
  const renderItem = useCallback(({ item }: { item: Country }) => (
    <CountryItem 
      item={item} 
      onPress={handleCountryPress} 
    />
  ), [handleCountryPress]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingComponent />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.title}>Select a Country</Text>
      <FlatList
        data={countries}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => (
          {length: itemHeight, offset: itemHeight * index, index}
        )}
      />
    </SafeAreaView>
  );
};

export default Country;

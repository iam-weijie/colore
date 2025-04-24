import { useEffect, useState, useCallback, memo, useRef } from "react";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { 
  FlatList, 
  Text, 
  TouchableOpacity, 
  View,
  StyleSheet,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addStatesToCache, generateAcronym, isNameTooLong } from "./cacheStore";
import ScrollingText from "./ScrollingText";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import React from "react";

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
  


  return (
    <TouchableOpacity
      className="flex-row items-center justify-between  mx-6 py-4 px-6 bg-white my-1 rounded-[32px]"
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View  className="flex-1 flex-row items-center">
        <Text className="mr-2" style={{ fontSize: 35 }}>{item.emoji}</Text>
       
          <Text className="text-base font-JakartaSemiBold max-w-[85%]">
            {item.name}
          </Text>
      
      </View>
      <Text className="font-JakartaSemiBold text-12 text-[#9ca3af]">
        {item.cca2}
      </Text>
    </TouchableOpacity>
  );
});

// Simple loading component with no animations
const LoadingComponent = () => {
  return (
    <View className="flex-1 items-center justify-center">
            <ColoreActivityIndicator text="Loading Countries..." />
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
      <SafeAreaView className="flex-1">
        <LoadingComponent />
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <View className="flex-row justify-between items-end pl-11 pt-16 bg-white">
                    <Text className="text-2xl font-JakartaBold my-4">Select a country</Text>
                  </View>
      <FlatList
        data={countries}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        contentContainerStyle={{ paddingTop: 16 }}
        windowSize={5}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => (
          {length: itemHeight, offset: itemHeight * index, index}
        )}
      />
    </View>
  );
};

export default Country;

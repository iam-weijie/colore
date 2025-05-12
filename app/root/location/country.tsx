import { useEffect, useState, useCallback, memo, useRef } from "react";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { 
  FlatList, 
  Text, 
  TouchableOpacity, 
  View,
  StyleSheet,
  Dimensions,
  TextInput,
  PanResponder
} from "react-native";
import { addStatesToCache, generateAcronym, isNameTooLong } from "./cacheStore";
import ScrollingText from "./ScrollingText";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import React from "react";
import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
// import AlphabetScrollbar from "@/components/AlphabetScrollbar";

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

interface CountryWithLetter extends Country {
  firstLetter: string;
}

interface AlphabetScrollbarProps {
  letters: string[];
  currentLetter: string;
  onLetterPress: (letter: string, index: number) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// All letters of the alphabet (predefined)
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Simple non-animated country item component
const CountryItem = memo(({ 
  item, 
  onPress,
}: { 
  item: CountryWithLetter, 
  onPress: (cca2: string, name: string) => void,
}) => {
  // Pre-bind the handler to prevent recreating it in render
  const handlePress = useCallback(() => {
    onPress(item.cca2, item.name);
  }, [onPress, item.cca2, item.name]);
  
  return (
    <TouchableOpacity
      className="flex-row items-center justify-between bg-white py-4 px-6 rounded-[32px] mx-5 my-1"
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View className="flex-1 flex-row items-center">
        <Text className="mr-2" style={{ fontSize: 35 }}>{item.emoji}</Text>
        <Text className="text-base font-JakartaSemiBold max-w-[85%]" numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <Text className="font-JakartaSemiBold text-xs text-[#9ca3af]">
        {item.cca2}
      </Text>
    </TouchableOpacity>
  );
});

// Empty country placeholder for fixed size list
const EmptyCountryItem = memo(() => (
  <View className="h-[76px] bg-transparent mx-5 my-1" />
));

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
  const [countries, setCountries] = useState<CountryWithLetter[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<CountryWithLetter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [currentLetter, setCurrentLetter] = useState<string>("A");
  const [availableLetters, setAvailableLetters] = useState<string[]>(ALPHABET);
  const [letterIndices, setLetterIndices] = useState<{[key: string]: number}>({});
  const [placeholderCount, setPlaceholderCount] = useState<number>(50); // Reduced from 200
  
  const flatListRef = useRef<FlatList>(null);
  const batchSize = useRef(50);
  const itemHeight = 76;
  
  // Initialize with placeholders for consistent layout
  useEffect(() => {
    // Pre-populate letter indices with estimated positions based on equal distribution
    const estimatedIndices: {[key: string]: number} = {};
    const estimatedCountPerLetter = Math.floor(placeholderCount / ALPHABET.length);
    
    ALPHABET.forEach((letter, index) => {
      estimatedIndices[letter] = index * estimatedCountPerLetter;
    });
    
    setLetterIndices(estimatedIndices);
  }, []);
  
  // Load countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get(
          "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries%2Bstates%2Bcities.json"
        );
        
        // Process in chunks
        let processedCountries: CountryWithLetter[] = [];
        
        const processChunk = (startIndex: number, data: any[]) => {
          const endIndex = Math.min(startIndex + batchSize.current, data.length);
          
          for (let i = startIndex; i < endIndex; i++) {
            const country = data[i];
            if (country.states && country.states.length > 0) {
              addStatesToCache(country.iso2, country.states);
              
              const name = country.name || "Unknown";
              processedCountries.push({
                cca2: country.iso2,
                name: name,
                emoji: country.emoji || "",
                hasStates: true,
                firstLetter: name.charAt(0).toUpperCase()
              });
            }
          }
          
          if (endIndex < data.length) {
            setTimeout(() => processChunk(endIndex, data), 0);
          } else {
            processedCountries.sort((a, b) => a.name.localeCompare(b.name));
            
            // Extract unique letters and their indices
            const letters: string[] = [];
            const indices: {[key: string]: number} = {};
            
            processedCountries.forEach((country, index) => {
              const letter = country.firstLetter;
              if (!letters.includes(letter)) {
                letters.push(letter);
                indices[letter] = index;
              }
            });
            
            // Include all letters for consistency, even if no countries start with them
            const fullLetters = [...ALPHABET];
            
            setAvailableLetters(fullLetters);
            setLetterIndices(indices);
            setCountries(processedCountries);
            setFilteredCountries(processedCountries);
            setPlaceholderCount(0);
            setLoading(false);
          }
        };
        
        processChunk(0, response.data);
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
        setPlaceholderCount(0);
      }
    };
    
    fetchCountries();
  }, []);

  // Filter countries based on search text
  useEffect(() => {
    if (countries.length > 0) {
      if (searchText) {
        const filtered = countries.filter(country => 
          country.name.toLowerCase().includes(searchText.toLowerCase()) ||
          country.cca2.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredCountries(filtered);
        
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
        
        // Keep all alphabet letters visible for consistency
        setLetterIndices(indices);
        
        if (letters.length > 0 && !letters.includes(currentLetter)) {
          setCurrentLetter(letters[0]);
        }
      } else {
        setFilteredCountries(countries);
        
        // Reset available letters to the full list
        const letters: string[] = [];
        const indices: {[key: string]: number} = {};
        
        countries.forEach((country, index) => {
          const letter = country.firstLetter;
          if (!letters.includes(letter)) {
            letters.push(letter);
            indices[letter] = index;
          }
        });
        
        setLetterIndices(indices);
      }
    }
  }, [countries, searchText]);
  
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

  // Handle letter selection from scrollbar
  const handleLetterPress = useCallback((letter: string, index: number) => {
    if (letterIndices[letter] !== undefined && flatListRef.current) {
      // Disable animation for smoother instant scrolling
      flatListRef.current.scrollToIndex({
        index: letterIndices[letter],
        animated: false,
        viewPosition: 0
      });
      setCurrentLetter(letter);
    } else if (countries.length > 0) {
      // Find the nearest letter that has countries
      const availableLetters = Object.keys(letterIndices).sort();
      if (availableLetters.length > 0) {
        // Find the nearest letter that comes after the selected one
        const nextLetterIndex = availableLetters.findIndex(l => l > letter);
        const nearestLetter = nextLetterIndex !== -1 
          ? availableLetters[nextLetterIndex] 
          : availableLetters[0];
          
        if (nearestLetter && letterIndices[nearestLetter] !== undefined && flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: letterIndices[nearestLetter],
            animated: false,
            viewPosition: 0
          });
          setCurrentLetter(nearestLetter);
        }
      }
    }
  }, [letterIndices, countries.length]);

  // Track visible items to update the current letter
  const handleViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: Array<{ item: CountryWithLetter | null }> }) => {
    if (viewableItems.length > 0 && viewableItems[0].item) {
      const firstItem = viewableItems[0].item;
      if (firstItem && firstItem.firstLetter) {
        setCurrentLetter(firstItem.firstLetter);
      }
    }
  }, []);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchText("");
  }, []);
  
  // Optimized keyExtractor with null handling
  const keyExtractor = useCallback((item: CountryWithLetter | null, index: number) => 
    item?.cca2 || `placeholder-${index}`, []);
  
  // Render item for flat list - handles both real countries and placeholders
  const renderItem = useCallback(({ item }: { item: CountryWithLetter | null }) => {
    if (!item) return <EmptyCountryItem />;
    return (
      <CountryItem 
        item={item} 
        onPress={handleCountryPress} 
      />
    );
  }, [handleCountryPress]);

  // Generate placeholder data for consistent sizing
  const getPlaceholderData = useCallback(() => {
    if (countries.length > 0 || placeholderCount === 0) {
      return filteredCountries;
    }
    
    // Return an array of nulls with the size of placeholderCount
    return Array(placeholderCount).fill(null);
  }, [countries.length, filteredCountries, placeholderCount]);

  if (loading && placeholderCount === 0) {
    return (
      <View className="flex-1">
        <LoadingComponent />
      </View>
    );
  }

  const displayData = getPlaceholderData();

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <Header title="Select a Country" />
      
      {loading && placeholderCount > 0 && (
        <View className="absolute top-0 left-0 right-0 bottom-0 items-center justify-center bg-black/5 z-20">
          <View className="bg-white p-6 rounded-3xl shadow-lg">
            <ColoreActivityIndicator text="Loading Countries..." />
          </View>
        </View>
      )}
      
      {/* Search bar */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center bg-white rounded-[24px] px-4 h-12">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 h-full text-base"
            placeholder="Search countries..."
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

      {/* Country list */}
      <View className="flex-1 mt-2">
        <FlatList
          ref={flatListRef}
          data={displayData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={30}
          windowSize={3}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
          getItemLayout={(data, index) => ({
            length: itemHeight,
            offset: itemHeight * index,
            index
          })}
          contentContainerStyle={{ paddingVertical: 8 }}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 10,
            minimumViewTime: 100
          }}
        />
        
        {/* Alphabet scrollbar */}
        {/* 
        <AlphabetScrollbar 
          letters={availableLetters}
          currentLetter={currentLetter}
          onLetterPress={handleLetterPress}
          containerHeight={screenHeight * 0.7}
        />
        */}
      </View>
    </View>
  );
};

export default Country;

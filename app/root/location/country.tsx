import { useEffect, useState } from "react";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { FlatList, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Define the State and Country interfaces
interface State {
  name: string;
  cities: string[];  // List of cities in the state
}

interface Country {
  cca2: string;  // Country code (ISO alpha-2)
  name: string;   // Country name
  emoji: string;  // Country flag emoji
  states: State[]; // List of states
}

const Country = () => {
  const { previousScreen } = useLocalSearchParams();
  const [countries, setCountries] = useState<Country[]>([]);

  // Fetch the entire dataset only once
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get(
          "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries%2Bstates%2Bcities.json"
        );

        // Transform the data into the structure we need (country, states, cities)
        const countryData = response.data.map((country: any) => ({
          cca2: country.iso2,  // ISO country code
          name: country.name || "Unknown",  // Country name (if available)
          emoji: country.emoji || "",  // Country flag emoji (if available)
          states: country.states || []  // States data
        }));

        // Sort countries alphabetically by name and filter out countries with no states
        const sortedCountries = countryData
          .sort((a, b) => a.name.localeCompare(b.name))
          .filter((country: Country) => country.states.length > 0);

        // Set the transformed and sorted countries data
        setCountries(sortedCountries);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };

    fetchCountries();
  }, []);  // Empty dependency array, so this runs only once on component mount

  return (
    <SafeAreaView className="flex-1">
      <Text className="text-xl font-JakartaBold m-3">Select a Country</Text>
      <FlatList
        data={countries}
        keyExtractor={(item) => item.cca2}  // Use country code as the key
        renderItem={({ item }) => (
          <TouchableOpacity
          className="flex flex-row items-center justify-between px-4 relative h-[60px]"
            onPress={() =>
              router.push({
                pathname: "/root/location/state",
                params: { 
                  country: item.name, 
                  countryId: item.cca2,  // Pass country code (cca2)
                  states: JSON.stringify(item.states),   // Serialize the states data to pass as a string
                  previousScreen: previousScreen 
                }
              })
            }
          >
            <Text className="font-JakartaSemiBold text-[16px] ml-3 my-2">
              {item.emoji} {item.name} {/* Display the country name */}
            </Text>
            <Text className="font-JakartaSemiBold text-[15px] text-gray-400 ml-3 my-2">
              {item.cca2} {/* Display the country name */}
            </Text>

          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default Country;

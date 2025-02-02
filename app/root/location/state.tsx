import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { FlatList, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Define the State interface
interface State {
  name: string;
  cities: string[];  // List of cities in the state
}

const State = () => {
  const { country, countryId, states, previousScreen } = useLocalSearchParams();

  // Parse the states data from the passed JSON string
  const countryStates: State[] = states ? JSON.parse(states as string) : [];

  return (
    <SafeAreaView className="flex-1">
      <Text className="text-lg font-JakartaSemiBold m-3">
        Select a State in {country}
      </Text>

      <FlatList
        data={countryStates}  // Use the parsed states data
        keyExtractor={(item) => item.name}  // Use state name as the key
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/root/location/city",
                params: { 
                  country: country, 
                  countryId: countryId,
                  state: item.name,
                  cities: JSON.stringify(item.cities),  // Pass the cities for the selected state
                  previousScreen: previousScreen 
                }
              })
            }
          >
            <Text className="font-JakartaSemiBold text-[16px] h-[18px] ml-3 my-2">
              {item.name} {/* Display the state name */}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default State;

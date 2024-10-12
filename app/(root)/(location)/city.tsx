import CustomButton from "@/components/CustomButton";
import { useNavigationContext } from "@/components/NavigationContext";
import { countries } from "@/constants/index";
import { fetchAPI } from "@/lib/fetch";
import { useUser } from "@clerk/clerk-expo";
import { Href, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const City = () => {
  const { user } = useUser();
  const { stateVars, setStateVars } = useNavigationContext();
  const { state, country } = useLocalSearchParams();

  const selectedCountry = countries.find((c) => c.name === country);
  const selectedState = selectedCountry?.states.find((s) => s.name === state);
  const cities = selectedState ? selectedState.cities : [];

  const [selectedCity, setSelectedCity] = useState("");

  const handleCityPress = (city: string) => {
    setSelectedCity(city);
  };
  const handleConfirmPress = async () => {
    setStateVars({
      ...stateVars,
      city: selectedCity,
      state: state,
      country: country,
      userLocation: `${selectedCity}, ${state}, ${country}`,
    });

    // update user info if they're coming from profile, otherwise
    // send them back to the user info page
    // without updating the database
    if (stateVars.previousScreen === "profile") {
      await fetchAPI("/(api)/(users)/patchUserInfo", {
        method: "PATCH",
        body: JSON.stringify({
          clerkId: user!.id,
          country: country,
          state: state,
          city: selectedCity,
        }),
      });
    }

    router.replace(`/(root)/${stateVars.previousScreen}` as Href<string>);
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex flex-row justify-between items-center ">
        <Text className="text-lg font-JakartaSemiBold m-3">
          Select a City in {state}
        </Text>

        <CustomButton
          className="w-14 h-8 rounded-md mx-3"
          fontSize="sm"
          title="Done"
          padding="0"
          onPress={handleConfirmPress}
          disabled={!selectedCity}
        />
      </View>

      <FlatList
        data={cities}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleCityPress(item)}>
            <Text className="font-JakartaSemiBold text-[15px] ml-3 my-2">
              {item}
            </Text>

            {selectedCity === item && (
              <Text className="absolute text-lg my-1 mx-3 right-0">✓</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default City;

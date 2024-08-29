import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import Ionicons from "react-native-vector-icons/Ionicons";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Screens
import LoginScreen from "./screens/auth/LoginScreen";
import SignupScreen from "./screens/auth/SignupScreen";
import DmScreen from "./screens/DmScreen";
import HomeScreen from "./screens/HomeScreen";
import UserScreen from "./screens/UserScreen";

// Screen names
const signupName = "Signup";
const homeName = "Driftn";
const dmName = "Message";
const loginName = "Login";
const userName = "User";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function MainContainer() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // simulate an auth check
  useEffect(() => {
    const checkAuthStatus = async () => {
      // TO DO: check auth status
      const userIsLoggedIn = false; // set to true if user is logged in
      setIsLoggedIn(userIsLoggedIn);
    };

    checkAuthStatus();
  }, []);

  // Bottom tab navigator
  const TabNavigator = () => {
    return (
      <Tab.Navigator
        initialRouteName={homeName}
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            let rn = route.name;

            if (rn === homeName) {
              iconName = focused ? "bottle-tonic" : "bottle-tonic-outline";
              return <Icon name={iconName} size={size + 5} color={color} />;
            } else if (rn === userName) {
              iconName = focused ? "person-circle" : "person-circle-outline";
            } else if (rn === dmName) {
              iconName = focused ? "chatbubbles" : "chatbubbles-outline";
            }
            return <Ionicons name={iconName} size={size + 5} color={color} />;
          },

          tabBarStyle: { paddingTop: 5 },
          tabBarLabelStyle: { display: "none" },
        })}
      >
        <Tab.Screen name={homeName} component={HomeScreen} />
        <Tab.Screen name={dmName} component={DmScreen} />
        <Tab.Screen name={userName} component={UserScreen} />
      </Tab.Navigator>
    );
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isLoggedIn ? (
          <Stack.Screen name="Home" component={TabNavigator} />
        ) : (
          <>
            <Stack.Screen
              name={signupName}
              component={SignupScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name={loginName}
              component={LoginScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

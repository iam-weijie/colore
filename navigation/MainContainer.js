import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Screens
import DmScreen from "./screens/DmScreen";
import HomeScreen from "./screens/HomeScreen";
import UserScreen from "./screens/UserScreen";

// Screen names
const homeName = "Driftn";
const dmName = "Message";
const userName = "User";

const Tab = createBottomTabNavigator();

export default function MainContainer() {
  return (
    <NavigationContainer>
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
    </NavigationContainer>
  );
}

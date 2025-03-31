import NotificationBubble from "@/components/NotificationBubble";
import { icons } from "@/constants";
import { Tabs } from "expo-router";
import { Alert, Image, ImageSourcePropType, View, Pressable, GestureResponderEvent } from "react-native"; // Replace TouchableOpacity with Pressable
import React from "react"; // Removed useState, useEffect as they are not used here
import { useGlobalContext } from "@/app/globalcontext";
// Removed useHaptics import, will call Haptics directly
import * as Haptics from 'expo-haptics'; // Import Haptics styles

const TabIcon = ({
  source,
  focused,
  unread,
  color
}: {
  source: ImageSourcePropType;
  focused: boolean;
  unread: number;
  color: string;
}) => (
  <View
  className={` self-center items-center justify-center ${focused ? "bg-general-600 rounded-full" : ""}`}
>
  <View
    className={`w-14 h-14 items-center justify-center rounded-full ${focused ? "bg-[#000000]" : ""} `}
  >
    {focused && (<Image
      source={source}
      tintColor="#ffffff"
      resizeMode="contain"
      className="w-10 h-10"


    />)}
    {!focused && (<Image
      source={source}
      tintColor="#000000"
      resizeMode="contain"
      className="w-9 h-9"
    />)}
      {/* Display NotificationBubble only when there are notifications */}
      {unread > 0 && <NotificationBubble unread={unread} color={color} />}
    </View>
  </View>
);

// Custom TabBarButton component with Haptics
const HapticTabBarButton = (props: any) => {
  const { hapticsEnabled } = useGlobalContext(); // Get haptics setting from context
  const { children, onPress, style, ...rest } = props;

  const handlePress = (e: GestureResponderEvent) => {
    if (hapticsEnabled) { // Check if haptics are enabled in settings
      Haptics.selectionAsync(); // Use selection feedback (very light)
    }
    if (onPress) {
      onPress(e); // Call original onPress handler
    }
  };

  // Use Pressable instead of TouchableOpacity
  return (
    <Pressable
      {...rest}
      onPress={handlePress}
      style={style} // Apply the original style passed by Tabs
    >
      {children}
    </Pressable>
  );
};


const Layout = () => {
  const { isIpad, unreadComments, unreadMessages, unreadRequests, unreadPersonalPosts } = useGlobalContext();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "white",
        tabBarShowLabel: false,
        tabBarStyle: {
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fafafa",
          height: 80,
          borderRadius: 50,
          paddingRight: 15,
          paddingLeft: 15,
          paddingBottom: isIpad ? 0 : 30,
          marginHorizontal: 30,
          marginBottom: 35,
          boxShadow: "0 0px 0px 3px rgba(0,0,0,1)"
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={icons.home}
              unread={0}
              color={"#FF7272"} // Needs to be changed with like notifications
            />
          ),
          tabBarButton: (props) => <HapticTabBarButton {...props} />, // Use custom button
        }}
      />
      <Tabs.Screen
        name="personal-board"
        options={{
          title: "Personal Board",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={icons.album}
              unread={unreadMessages + unreadRequests + unreadPersonalPosts}
              color={"#fbb1d6"} // Needs to be changed with message notifications
            />
          ),
          tabBarButton: (props) => <HapticTabBarButton {...props} />, // Use custom button
        // Removed misplaced parenthesis, comma and duplicate tabBarButton
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={icons.profile}
              unread={unreadComments}
              color={"#72B2FF"}
            />
          ),
          tabBarButton: (props) => <HapticTabBarButton {...props} />, // Add custom button to profile screen
        }}
      />
    </Tabs>
  );
};

export default Layout;
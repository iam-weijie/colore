import NotificationBubble from "@/components/NotificationBubble";
import { NotificationBubbleProps } from "@/types/type";
import { icons } from "@/constants";
import { Tabs } from "expo-router";
import { Image, ImageSourcePropType, View } from "react-native";

const TabIcon = ({
  source,
  focused,
  notifications
}: {
  source: ImageSourcePropType;
  focused: boolean;
  notifications: NotificationBubbleProps;
}) => (
  <View
    className={`items-center justify-center ${focused ? "bg-general-300 rounded-full" : ""}`}
  >
    <View
      className={`w-12 h-12 items-center justify-center rounded-full ${focused ? "bg-gray-500" : ""}`}
    >
      <Image
        source={source}
        tintColor="white"
        resizeMode="contain"
        className="w-7 h-7"
      />
     <NotificationBubble type = {notifications} ></NotificationBubble>
    
    </View>
  </View>
);

const Layout = () => (
  <Tabs
    screenOptions={{
      tabBarActiveTintColor: "white",
      tabBarInactiveTintColor: "white",
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: "#333333",
        borderRadius: 50,
        paddingBottom: 25,
        overflow: "hidden",
        marginHorizontal: 20,
        marginBottom: 20,
        height: 70,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        position: "absolute",
      },
    }}
  >
    <Tabs.Screen
      name="home"
      options={{
        title: "Home",
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} source={icons.home} notifications="likes"/>
        ),
      }}
    />
    <Tabs.Screen
      name="chat"
      options={{
        title: "Chat",
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} source={icons.chat} notifications="messages"/>
        ),
      }}
    />
    <Tabs.Screen
      name="profile"
      options={{
        title: "Profile",
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} source={icons.profile} notifications="comments" />
        ),
      }}
    />
  </Tabs>
);

export default Layout;

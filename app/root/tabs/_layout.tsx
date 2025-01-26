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
    className={`items-center justify-center ${focused ? "bg-general-600 rounded-full" : ""}`}
  >
    <View
      className={`w-14 h-14 items-center justify-center rounded-full ${focused ? "bg-[#000000]" : ""}`}
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
        backgroundColor: "#fafafa",
        borderRadius: 50,
        paddingRight: 15,
        paddingLeft: 15,
        paddingBottom: 30,
        overflow: "hidden",
        marginHorizontal: 20,
        marginBottom: 35,
        height: 80,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        position: "absolute",
        boxShadow: "0 0px 0px 3px rgba(0,0,0,1)"
       // boxShadow: "-4px 0px 25px 5px rgba(243,255,0, 0.17), 10px 0px 20px 8px rgba(255,0,221, 0.17)"
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

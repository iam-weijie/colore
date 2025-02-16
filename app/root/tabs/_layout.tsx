import NotificationBubble from "@/components/NotificationBubble";
import { fetchAPI } from "@/lib/fetch";
import { icons } from "@/constants";
import { Tabs } from "expo-router";
import { Alert, Image, ImageSourcePropType, View } from "react-native";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useNotification } from '@/notifications/NotificationContext'; // Assuming you have a notification context to manage global state
import { sendPushNotification } from '@/notifications/PushNotificationService'; // Assuming this handles the push notification
import { useGlobalContext } from "@/app/globalcontext";

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
    />)}r
      {/* Display NotificationBubble only when there are notifications */}
      {unread > 0 && <NotificationBubble unread={unread} color={color} />}
    </View>
  </View>
);

const Layout = () => {
  const { notifications, unreadComments, unreadMessages } = useGlobalContext();

  console.log(notifications, unreadComments, unreadMessages)
  return (
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
          marginHorizontal: 30,
          marginBottom: 35,
          height: 80,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "row",
          position: "absolute",
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
        }}
      />
      <Tabs.Screen
        name="personal-board"
        options={{
          title: "Chat",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={icons.chat}
              unread={unreadMessages}
              color={"#FF7272"} // Needs to be changed with message notifications
            />
          ),
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
        }}
      />
    </Tabs>
  );
};

export default Layout;

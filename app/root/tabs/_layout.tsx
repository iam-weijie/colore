import NotificationBubble from "@/components/NotificationBubble";
import { icons } from "@/constants";
import { Tabs } from "expo-router";
import { Alert, Image, ImageSourcePropType, View } from "react-native";
import React, { useState, useEffect } from "react";
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
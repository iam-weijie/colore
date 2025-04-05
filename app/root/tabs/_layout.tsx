import { Tabs } from 'expo-router';
import React, { useEffect, useState, useRef } from "react";
import { Animated, Image, View, Text, StyleSheet, Pressable, GestureResponderEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import NotificationBubble from '@/components/NotificationBubble';
import { icons } from '@/constants';
import { useGlobalContext } from '@/app/globalcontext';
import { useNavigationContext } from "@/components/NavigationContext";
import { transform } from '@babel/core';

interface TabIconProps {
  source: any;
  focused: boolean;
  unread: number;
  color: string;
  label?: string;
  isCenter?: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ source, focused, unread, color, label, isCenter = false }) => {


  return (
    <View className="flex flex-column  items-center justify-center" style={[isCenter && styles.centerContainer]}>
  
      <View className={`flex items-center justify-center ${isCenter ? 'w-16 h-16 bg-black rounded-full shadow-md': ''}`}>
      
        <Animated.Image
          source={source}
          className='flex-1 w-7 h-7'
          style={[
            { tintColor: isCenter ? '#fff' : focused ? "#000" : '#000'}
          ]}
          resizeMode="contain"
        />
        {unread > 0 && <NotificationBubble unread={unread} color={color} />}
      </View>
      <View>
        <Text className="w-full" style={{ color: focused ? "#000" : '#000', fontSize: 12 }}></Text>
      </View>
    </View>
  );
};

interface HapticTabBarButtonProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  style?: any;
}

const HapticTabBarButton: React.FC<HapticTabBarButtonProps> = ({ children, onPress, style, ...rest }) => {
  const { hapticsEnabled } = useGlobalContext();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = (e: GestureResponderEvent) => {
    if (hapticsEnabled) {
      Haptics.selectionAsync();
    }
    if (onPress) {
      onPress(e);
    }
  };

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const animatedStyle = {
    transform: [{ scale }],
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style} // Apply only the passed style to Pressable
      {...rest}
    >
      <Animated.View style={animatedStyle}> {/* Wrap children in Animated.View */}
        {children}
      </Animated.View>
    </Pressable>
  );
};


const Layout: React.FC = () => {
  const { isIpad, unreadComments, unreadMessages, unreadRequests, unreadPersonalPosts } = useGlobalContext();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fafafa',
          height: 85,
          borderRadius: 50,
          paddingRight: 15,
          paddingLeft: 15,
          paddingBottom: isIpad ? 0 : 20,
          marginHorizontal: 30,
          marginBottom: 35,
          boxShadow: '-6px -3px 13px 3px rgba(250,230,64,0.15), 5px 4px 13px 3px rgba(202, 177, 251, 0.25)',
        },
      }}
    >
      <Tabs.Screen
        name="global-board"
        options={{
          title: 'Global Board',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={icons.star}
              focused={focused}
              unread={unreadMessages}
              color="#72B2FF"
              label="Starring"
            />
          ),
          tabBarButton: (props) => <HapticTabBarButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Global Board',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={icons.globe}
              focused={focused}
              unread={unreadComments}
              color="#72B2FF"
              label="Global"
            />
          ),
          tabBarButton: (props) => <HapticTabBarButton {...props} />,
        }} />
      <Tabs.Screen
        name="personal-board"
        options={{
          title: 'Personal Board',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={icons.menu}
              focused={focused}
              unread={unreadPersonalPosts}
              color="#72B2FF"
              isCenter
            />
          ),
          tabBarButton: (props) => <HapticTabBarButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="new-post"
        options={{
          title: 'New Post',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={icons.plus}
              focused={focused}
              unread={0}
              color="#fbb1d6"
              label="Post"
              style={{ marginTop: -10 }}
            />
          ),
          tabBarButton: (props) => <HapticTabBarButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={icons.profile}
              focused={focused}
              unread={unreadComments + unreadRequests}
              color="#72B2FF"
              label="Profile"
            />
          ),
          tabBarButton: (props) => <HapticTabBarButton {...props} />,
        }}
      />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    marginTop: -60,
    zIndex: 10
  }
});

export default Layout;

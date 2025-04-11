import { Tabs } from 'expo-router';
import React, { useEffect, useState, useRef } from "react";
import { Animated, Image, View, Text, StyleSheet, Pressable, GestureResponderEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import NotificationBubble from '@/components/NotificationBubble';
import { icons, images } from '@/constants';
import { useGlobalContext } from '@/app/globalcontext';
import { useNavigationState } from '@react-navigation/native';
import MaskedView from '@react-native-masked-view/masked-view';
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
    <View className={`flex flex-column  items-center justify-center  ${isCenter && '-mt-16' }`}>
  
      <View className={`flex items-center justify-center ${isCenter && `${ focused ? 'bg-black' : 'bg-[#FAFAFA]'} w-16 h-16 rounded-full shadow-md`}`}>
      {focused && !isCenter && <View className='absolute'>
      <MaskedView
      style={{ width: 60, height: 60 }}
        maskElement={
    <Image
      source={
        label == "Boards" ? images.highlight1 :
        (label == "Starring" ? images.highlight2 : 
          (label == "Create" ? images.highlight3 :
            images.highlight4
          )
        )
      }
      style={{
        width: 60,
        height: 60,
      }}
    />
  }
>
  <View style={{ flex: 1, backgroundColor: color }} />
</MaskedView>
      </View>}
        <Animated.Image
          source={source}
          className={`flex-1 ${['Create', 'Boards'].includes(label ?? "") ? 'w-5 h-5' : 'w-6 h-6'}`}
          style={[
            { tintColor: isCenter ? `${focused ? '#fff' : '#888'}` : focused ? "#000" :  "#888"}
          ]}
          resizeMode="contain"
        />
      </View>
      <View>
        <Text className={`w-full txt-center text-xs font-JakartaBold -mt-1`} style={[{ color: focused ? "#000"  : "#888" }]}>
          {label}
        </Text>
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


const getFocusedTabRouteName = (state: any): string | undefined => {
  if (!state) return undefined;
  const route = state.routes[state.index];
  if (route.state) {
    // Recurse into nested navigators
    return getFocusedTabRouteName(route.state);
  }
  return route.name;
};


const Layout: React.FC = () => {
  const { isIpad, unreadComments, unreadMessages, unreadRequests, unreadPersonalPosts } = useGlobalContext();
  const navigationState = useNavigationState((state) => state);
  const currentTab = getFocusedTabRouteName(navigationState);

  const isCreateFocused = currentTab === "create";
  const isBoardFocused = currentTab === "personal-board";
  const isStarringFocused = currentTab === "starring-gallery";
  
  const dynamicShadow = isCreateFocused
    ? '-6px -3px 13px 3px rgba(251, 177, 214, 0.25), 5px 4px 13px 3px rgba(147, 197, 253, 0.25)'
    : ( isBoardFocused 
      ? '-6px -3px 13px 3px rgba(147, 197, 253, 0.25), 5px 4px 13px 3px rgba(202, 177, 251, 0.25)'
      : (isStarringFocused 
        ?  '-6px -3px 13px 3px rgba(250,230,64,0.15), 5px 4px 13px 3px rgba(251, 177, 214, 0.25)'
        : '-6px -3px 13px 3px rgba(250,230,64,0.15), 5px 4px 13px 3px rgba(147, 197, 253, 0.25)'));

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
          paddingBottom: isIpad ? 0 : 18,
          marginHorizontal: 30,
          marginBottom: 35,
          boxShadow: dynamicShadow,
        },
      }}
    >
        <Tabs.Screen
        name="personal-board"
        options={{
          title: 'Boards',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={icons.menu}
              focused={focused}
              unread={0}
              color="#CFB1FB"
             label="Boards"
            />
          ),
          tabBarButton: (props) => <HapticTabBarButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="starring-gallery"
        options={{
          title: 'Starring',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={icons.star}
              focused={focused}
              unread={0}
              color="#ffe640"
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
              unread={unreadPersonalPosts}
              color="#E2C7FF"
              
              isCenter
            />
          ),
          tabBarButton: (props) => <HapticTabBarButton {...props} />,
        }} />
     
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={icons.plus}
              focused={focused}
              unread={0}
              color="#fbb1d6"
              label="Create"
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
              color="#93c5fd"
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
    marginTop: -50,
    zIndex: 10
  }
});

export default Layout;

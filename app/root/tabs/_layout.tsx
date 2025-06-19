import { Tabs } from 'expo-router';
import React, { useEffect, useState, useRef } from "react";
import { Animated, Image, View, Text, StyleSheet, Pressable, GestureResponderEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import NotificationBubble from '@/components/NotificationBubble';
import { icons, images } from '@/constants';
import { useSettingsContext } from "@/app/contexts/SettingsContext";
import { useDevice } from "@/app/contexts/DeviceContext";
import { useNotificationsContext } from "@/app/contexts/NotificationsContext";
import { useNavigationState } from '@react-navigation/native';
import { CustomTabBar } from '@/components/CustomTabBar';
import TabIcon from '@/components/TabIcon';
import MaskedView from '@react-native-masked-view/masked-view';
import { useNavigationContext } from "@/components/NavigationContext";
import { transform } from '@babel/core';
import { useHaptics } from '@/hooks/useHaptics';
import { useSoundEffects, SoundType } from '@/hooks/useSoundEffects';
import { SignedIn } from '@clerk/clerk-expo';

interface HapticTabBarButtonProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  style?: any;
}

const HapticTabBarButton: React.FC<HapticTabBarButtonProps> = ({ 
  children, 
  onPress, 
  style,
  isCenter = false,
  ...rest 
}) => {
  const { hapticsEnabled, soundEffectsEnabled } = useSettingsContext();
  const { triggerHaptic } = useHaptics();
  const { playSoundEffect } = useSoundEffects();
  
  // Animation values
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const isCenterUp = useSharedValue(false);

  // Center button animation
  const animateCenterButton = () => {
    if (!isCenterUp.value) {
      rotate.value = withTiming(1, {
        duration: 400,
        easing: Easing.inOut(Easing.ease)
      });
    }
    
    isCenterUp.value = !isCenterUp.value;
    translateY.value = withSpring(
      isCenterUp.value ? -10 : 0,
      { damping: 10, stiffness: 300 }
    );
    
    if (hapticsEnabled) {
      runOnJS(triggerHaptic)(Haptics.ImpactFeedbackStyle.Heavy);
    }
    runOnJS(playSoundEffect)(SoundType.Navigation);
  };

  // Regular button bounce animation
  const bounceAnimation = () => {
    scale.value = withSequence(
      withTiming(0.9, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 250 })
    );
    
    if (hapticsEnabled) {
      runOnJS(triggerHaptic)(Haptics.ImpactFeedbackStyle.Light);
    }
    runOnJS(playSoundEffect)(SoundType.Navigation);
  };

  const handlePress = () => {
    if (isCenter) {
      animateCenterButton();
    } else {
      bounceAnimation();
    }
    onPress?.();
  };

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    if (isCenter) {
      return {
        transform: [
          { rotate: `${rotate.value * 360}deg` },
          { translateY: translateY.value },
        ]
      };
    }
    return {
      transform: [
        { scale: scale.value },
        { translateY: withSpring(0) } // Default state for non-center buttons
      ]
    };
  });

  return (
    <Pressable
      onPress={handlePress}
      style={style}
      {...rest}
    >
      <Animated.View style={[
        animatedStyle,
        { alignItems: 'center' },
        isCenter && { marginTop: -15 } // Adjust for center button elevation
      ]}>
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
  const { hapticsEnabled, soundEffectsEnabled } = useSettingsContext();
  const { isIpad } = useDevice();
  const { unreadComments, unreadMessages, unreadRequests, unreadPersonalPosts } = useNotificationsContext();
  const navigationState = useNavigationState((state) => state);
  const currentTab = getFocusedTabRouteName(navigationState);

  const isCreateFocused = currentTab === "create";
  const isBoardFocused = currentTab === "personal-board";
  const isStarringFocused = currentTab === "starring-gallery";
  
  const dynamicShadow = isCreateFocused
    ? '-6px -3px 13px 3px rgba(251, 177, 214, 0.25), 5px 4px 13px 3px rgba(147, 197, 253, 0.25)'
    : ( isBoardFocused 
      ? '-6px -3px 13px 3px rgba(2, 0.25), 5px 4px 13px 3px rgba(202, 177, 251, 0.25)'
      : (isStarringFocused 
        ?  '-6px -3px 13px 3px rgba(250,230,64,0.25), 5px 4px 13px 3px rgba(251, 177, 214, 0.25)'
        : '-6px -3px 13px 3px rgba(250,230,64,0.25), 5px 4px 13px 3px rgba(147, 197, 253, 0.25)'));

  return (
    <SignedIn>
<Tabs
  tabBar={(props) => <CustomTabBar {...props} />}
  screenOptions={{
    tabBarShowLabel: false,
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
              source={icons.home}
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
              color="#FBB1F5"
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
    </SignedIn>
  );
};


export default Layout;

import NotificationBubble from "@/components/NotificationBubble";
import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from 'expo-haptics';
//import { ScrollView } from "react-native-gesture-handler";

type TabNavigationProps = {
  name: string;
  focused: boolean;
  onPress: () => void;
  notifications: number;
};

const TabNavigation: React.FC<TabNavigationProps> = ({
  name,
  focused,
  onPress,
  notifications,
}) => {
  return (
    <TouchableOpacity
    className={`flex-1 py-3 w-full ${focused ? 'border-b-2 border-black' : ''}`}
  activeOpacity={0.6}
  onPress={() => {
    onPress()
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);}}
>
  <View className="flex flex-row items-center justify-center w-full">
    <Text
      className="text-[16px] text-center font-[600]"
      style={{ color: focused ? "#000" : "#888" }}
    >
      {name}
    </Text>
    {notifications > 0 && <View className="absolute right-2 top-[50%] -mt-1"><NotificationBubble unread={notifications} color={"#FF0000"} /></View>}
    </View>
 
</TouchableOpacity>
  );
};

export default TabNavigation;
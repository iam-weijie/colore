import NotificationBubble from "@/components/NotificationBubble";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import * as Haptics from 'expo-haptics';
import { useHaptics } from "@/hooks/useHaptics";
import { formatNumber } from "@/lib/utils";
//import { ScrollView } from "react-native-gesture-handler";

type TabNavigationProps = {
  name: string;
  focused: boolean;
  onPress: () => void;
  notifications: number;
  color?: string;
};

const TabNavigation: React.FC<TabNavigationProps> = ({
  name,
  focused,
  onPress,
  notifications,
  color = "#000",
}) => {
  const { triggerHaptic } = useHaptics();
  
  return (
    <TouchableOpacity
    className={`flex-1 py-4 w-full `}
  activeOpacity={0.6}
  onPress={() => {
    onPress()
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
  }}
>

  <View className="flex flex-row items-center justify-center w-full">

    <Text
      className={`relative text-[14px] ${focused ? "font-JakartaSemiBold" : "font-JakartaMedium"} text-center `}
      style={{ color: focused ? "#000" : "#B1B1B1" }}
    >
      {name}
    </Text>

              {notifications > 0 && <View className="ml-1 -mt-1"><NotificationBubble unread={notifications} color={"#FF0000"} /></View>}
    </View>
 
</TouchableOpacity>
  );
};

export default TabNavigation;
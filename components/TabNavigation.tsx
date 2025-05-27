import NotificationBubble from "@/components/NotificationBubble";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import * as Haptics from 'expo-haptics';
import { useHaptics } from "@/hooks/useHaptics";
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
      className="text-[15px] font-JakartaSemiBold text-center font-[600]"
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
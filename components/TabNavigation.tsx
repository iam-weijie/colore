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
  const handlePress = () => {
    onPress();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const { triggerHaptic } = useHaptics();
  
  return (
    <TouchableOpacity
      className="flex-1 items-center justify-center py-4"
      activeOpacity={0.6}
      onPress={handlePress}
    >
      <View className="relative">
        <Text
          className="text-[16px] font-[600]"
          style={{ 
            color: focused ? "#000" : "#888",
          }}
        >
          {name}
        </Text>
        
        {notifications > 0 && (
          <View className="absolute -right-3 top-1.5">
            <NotificationBubble unread={notifications} color={"#FF0000"} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default TabNavigation;
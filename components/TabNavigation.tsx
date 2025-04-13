import NotificationBubble from "@/components/NotificationBubble";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { icons, images } from '@/constants';
import {
  Text,
  Image,
  TouchableOpacity,
  View,
} from "react-native";
import MaskedView from '@react-native-masked-view/masked-view';
import * as Haptics from 'expo-haptics';
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
  color
}) => {
  return (
    <TouchableOpacity
    className={`py-3 flex-1 `}
  activeOpacity={0.6}
  onPress={() => {
    onPress()
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);}}
>
  {/*focused && <View className='absolute flex-1 w-full -mt-2 '>
        <MaskedView
        style={{ 
          width: 110, 
          height: 60,
         left: (name == 'Mine' || name == 'Discover') ? 30 : 0}}
          maskElement={
      <Image
        source={ images.highlightLg1 
        }
        style={{
          width: 110,
          height: 60,
        }}
      />
    }
  >
    <View style={{ flex: 1, backgroundColor: color ?? "#ffe640" }} />
  </MaskedView>
        </View>*/}
  <View className="flex-row items-center justify-center py-2">
    <Text
      className="text-[16px]  font-[600]  border-black"
      style={{ 
        color: focused ? "#000" : "#888",
        borderBottomWidth: focused ? 2 : 0  
      }}
    >
      {name}
    </Text>
    {notifications > 0 && <View className="absolute right-2 top-[50%] -mt-1"><NotificationBubble unread={notifications} color={"#FF0000"} /></View>}
    </View>
 
</TouchableOpacity>
  );
};

export default TabNavigation;
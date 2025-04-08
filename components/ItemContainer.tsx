import React, { useEffect, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { icons, temporaryColors } from "@/constants";
import { LinearGradient } from 'expo-linear-gradient';


const ItemContainer = ({label, caption, icon, iconColor, onPress}: 
  {label: string, caption?: string, icon: ImageSourcePropType, iconColor: string, onPress: () => void}) => {
    return (
      <TouchableOpacity
      className="relative flex  mb-3 py-4 pl-3 pr-7 rounded-[24px] w-full"
      style={{ 
        backgroundColor: "#FAFAFA" }}
      activeOpacity={0.6}
      onPress={() => {
        onPress();
      }}
    >
              <View className="flex-1 flex flex-row items-center justify-between w-full">
                  <View className="flex-row items-center justify-start">
                  <LinearGradient
                      colors={['#fbb1d6', '#93c5fd']} // 🎨 your gradient colors
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="rounded-[16px] p-[4px] mx-3" // outer border rounding and padding
                    >
                    <View className="flex-row items-center rounded-[14px] p-2">
                    <Image
                      source={icon}
                      className="w-5 h-5"
                      style={{ tintColor: iconColor }}
                    />
                    </View>
                  </LinearGradient>
                    <View className="flex flex-col items-start">
                    <Text className="text-[14px] font-bold text-[#000] ">
                      {label}
                    </Text>
                    {caption && <Text className="text-[12px] text-gray-400 ">
                      {caption}
                    </Text>}
                    </View>
                    </View>
                    <Image
                      source={icons.chevron}
                      className="w-5 h-5"
                      style={{ tintColor: "#000" }}
                    />
                  </View>
               
             
            </TouchableOpacity>
            
    )
}

export default ItemContainer;
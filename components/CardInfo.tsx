import { icons } from "@/constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Switch, // Import Switch
  Text,
  Dimensions,
  Image,
  TouchableOpacity,
  View,
} from "react-native";
import ModalSheet from "./Modal";


const SCREEN_HEIGHT = Dimensions.get("screen").height

export const HeaderCard = ({ title, color, content, infoView }) => {

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

 return (
  <View className="rounded-[48px] py-4 mb-2"
    style={{
      backgroundColor: "#ffffff",
      borderColor: "#fafafa80",
      shadowColor: "#63636388",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
    }}>
      <View className="flex flex-row justify-between items-center">
    <View 
      className="px-2 py-1 rounded-[48px] w-[60%] ml-5 overflow-hidden shadow-sm border-2" 
      style={{
        backgroundColor: color,
        borderColor: "#ffffff80",
        shadowColor: "#636363",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      }}
    >
      <View className="px-4 py-2">
        <Text className={`text-[16px] font-JakartaSemiBold ${color === "#FFFFFF" ? "text-black" : "text-white"}`}>{title}</Text>
      </View>
    </View>
    <View className="mr-8">
      <TouchableOpacity
      onPress={() => {setIsModalVisible(true)}}>
    <Image
    source={icons.info}
    className="w-4 h-4"
    tintColor="#000"
    />
    </TouchableOpacity>
    </View>
    </View>
    
    <View className="px-4 py-4 rounded-[48px] overflow-hidden">
      {content}
    </View>
      <ModalSheet title="" isVisible={isModalVisible} onClose={() => {setIsModalVisible(false)}}>
        <View className="flex-1 px-2"
        style={{
          height: SCREEN_HEIGHT * 0.6
        }}>
          {infoView}
        </View>
      </ModalSheet>
    
  </View>
)};

export const DetailRow = ({ 
  label, 
  value, 
  onPress, 
  accentColor = "#6b7280" 
}) => (
  <View className="px-6 py-4 ">
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row justify-between items-center w-full"
      disabled={!onPress}
    >
      <Text className="text-sm font-JakartaSemiBold text-gray-800">
        {label}
      </Text>
      
      <View className="flex-row items-center">
        <Text className="text-sm text-gray-400 font-Jakarta mr-2">
          {value || "Not specified"}
        </Text>
        {onPress && (
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={20} 
            color="#9ca3af"
          />
        )}
      </View>
    </TouchableOpacity>
  </View>
);

export const ActionRow = ({ icon, label, count, onPress, accentColor }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    className="px-4 py-2 flex flex-row items-center justify-between "
  >
    <View className="flex flex-row items-center">
      <View className="p-2 rounded-xl mr-3" style={{ backgroundColor: "#fafafa" }}>
        {icon}
      </View>
      <Text className="text-[14px] font-JakartaSemiBold text-gray-800">{label}</Text>
    </View>
    <View className="flex flex-row items-center">
      <Text className="text-gray-600 text-sm mr-2">{count}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
    </View>
  </TouchableOpacity>
);

export const ToggleRow = ({ label, description, value, onValueChange, accentColor }) => (
  <View className="px-6 py-2 flex flex-row items-center justify-between last:border-b-0">
    <View className="flex-1">
      <Text className="text-[14px] font-JakartaSemiBold text-gray-800 mb-1">{label}</Text>
      <Text className="text-[12px] text-gray-800">{description}</Text>
    </View>
    <Switch
      trackColor={{ false: "#fafafa", true: accentColor }}
      thumbColor={value ? "#ffffff" : "#f4f3f4"}
      ios_backgroundColor="#E5E7EB"
      onValueChange={onValueChange}
      value={value}
    />
  </View>
);
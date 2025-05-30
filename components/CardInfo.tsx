import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Switch, // Import Switch
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export const HeaderCard = ({ title, color, content }) => (
  <View className="rounded-[48px] py-3"
    style={{
      backgroundColor: "#ffffff",
      borderColor: "#fafafa80",
      shadowColor: "#63636388",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
    }}>
    <View 
      className="px-4 py-2 rounded-[48px] w-[70%] ml-5 overflow-hidden shadow-sm border-2" 
      style={{
        backgroundColor: color,
        borderColor: "#ffffff80",
        shadowColor: "#636363",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      }}
    >
      <View className="px-5 py-2">
        <Text className={`text-[18px] font-JakartaSemiBold ${color === "#FAFAFA" ? "text-black" : "text-white"}`}>{title}</Text>
      </View>
    </View>
    
    <View className="px-4 pb-4 rounded-[48px] overflow-hidden shadow-sm">
      {content}
    </View>
  </View>
);

export const DetailRow = ({ label, value, onPress, accentColor }) => (
  <View className="px-5 py-3  last:border-b-0">
    <View className="flex flex-row items-center justify-between mb-1">
      <Text className="text-[16px] font-JakartaSemiBold text-gray-800">{label}</Text>
      {onPress && <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        className="px-3 py-2 rounded-full"
        style={{ backgroundColor: accentColor }}
      >
        <Text className="text-sm font-JakartaSemiBold text-white">Update</Text>
      </TouchableOpacity>}
    </View>
    <Text className="text-gray-800 text-[14px] font-JakartaMedium">
      {value || "Not specified"}
    </Text>
  </View>
);

export const ActionRow = ({ icon, label, count, onPress, accentColor }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    className="px-5 py-4 flex flex-row items-center justify-between "
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
  <View className="px-5 py-3 flex flex-row items-center justify-between last:border-b-0">
    <View className="flex-1">
      <Text className="text-[16px] font-JakartaSemiBold text-gray-800 mb-1">{label}</Text>
      <Text className="text-[14px] text-gray-800">{description}</Text>
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
import { Modal, Pressable, Text, TouchableOpacity, View,  Animated } from "react-native";
import React, { useEffect, useRef, useState,  useCallback } from "react";

type MenuItem = {
  label: string;
  onPress: () => void;
}

type DropdownMenuProps = {
  menuItems: MenuItem[];
  customMenuWidth?: number;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ menuItems, customMenuWidth }) => {
  const [visible, setVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0});
  const triggerRef = useRef<View>(null); // get position of trigger element
  const menuWidth = customMenuWidth ? customMenuWidth : 100;

  const handlePress = () => {
    if (triggerRef.current) {
      triggerRef.current.measure((fx, fy, width, height, pageX, pageY) => {
        setMenuPosition({ top: pageY + height, left: pageX + width - menuWidth});
        setVisible(true);
      });
    }
  }

  const slideAnim = useRef(new Animated.Value(300)).current; // Start off-screen

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0, // Slide into view
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300, // Slide out of view
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <View className="relative">
      <TouchableOpacity onPress={handlePress} ref={triggerRef}>
        <View className="flex flex-row justify-center items-center h-6 w-6">
          <View className="w-1 h-1 bg-gray-600 rounded-full mr-1" />
          <View className="w-1 h-1 bg-gray-600 rounded-full mr-1" />
          <View className="w-1 h-1 bg-gray-600 rounded-full" />
        </View>
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={visible}
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/30"
          onPress={() => setVisible(false)}
        />
          <Animated.View
        style={{
          transform: [{ translateY: slideAnim }],
        }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg p-4"
      >
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              setVisible(false);
              item.onPress();
            }}
            className={`flex-row items-center px-4 py-3 ${
              index < menuItems.length - 1 ? "border-b border-gray-200" : ""
            }`}
          >
            <Text className="font-Jakarta text-base">{item.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
      </Modal>
    </View>
  );
};

export default DropdownMenu;

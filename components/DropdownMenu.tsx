import { Animated, Image, ImageSourcePropType, Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import React, { useEffect, useRef, useState } from "react";

type MenuItem = {
  label: string;
  source: ImageSourcePropType;
  onPress: () => void;
};

type DropdownMenuProps = {
  menuItems: MenuItem[];
  customMenuWidth?: number;
};

const DropdownMenu: React.FC<DropdownMenuProps> = ({ menuItems, customMenuWidth }) => {
  const [visible, setVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<View>(null);
  const menuWidth = customMenuWidth ? customMenuWidth : 100;

  const slideAnim = useRef(new Animated.Value(300)).current; 

  const handlePress = () => {
    if (triggerRef.current) {
      triggerRef.current.measure((fx, fy, width, height, pageX, pageY) => {
        setMenuPosition({ top: pageY + height, left: pageX + width - menuWidth });
        setVisible(true);
      });
    }
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 300, // Slide out
      duration: 120,
      useNativeDriver: true,
    }).start(() => setVisible(false)); // Hide modal after animation
  };

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(300); // Reset before opening
      Animated.timing(slideAnim, {
        toValue: 0, // Slide into view
        duration: 200,
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
        transparent
        visible={visible}
        onRequestClose={handleClose} // Handles close on Android back button
      >
        <Pressable
          className="flex-1 bg-black/30"
          onPress={handleClose} // Handles closing when pressing outside
        />
        <Animated.View
          style={{ transform: [{ translateY: slideAnim }] }}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-lg p-8 "
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                handleClose(); // Close after selecting an item
                item.onPress();
              }}
              className={`flex-row items-center px-4 py-5 ${
                index < menuItems.length - 1 ? "border-b border-gray-200" : ""
              }`}
            >
              <View className="flex-row items-center">
                <Image
                  source={item.source}
                  tintColor="#A7A7A7"
                  resizeMode="contain"
                  className="w-5 h-5 mr-2"
                />
                <Text className="font-JakartaSemiBold text-[16px]">{item.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Modal>
    </View>
  );
};

export default DropdownMenu;

import React, { useState, useRef } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

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
        >
          <View 
            style={{ top: menuPosition.top, left: menuPosition.left, width: menuWidth }}
            className="bg-white rounded-lg shadow-lg"
          >           
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setVisible(false);
                  item.onPress();
                }}
                className={`flex-row items-center px-4 py-3 ${index < menuItems.length - 1 ? "border-b border-gray-200" : ""}`}
              >
                <Text className="font-Jakarta text-base">{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default DropdownMenu;

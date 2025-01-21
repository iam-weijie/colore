import React, { useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

type MenuItem = {
  label: string;
  onPress: () => void;
}

type DropdownMenuProps = {
  menuItems: MenuItem[];
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ menuItems }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)}>
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
          <View className="absolute top-16 right-8 bg-white rounded-lg shadow-lg">           
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={async () => {
                  setVisible(false);
                  item.onPress();
                }}
                className="flex-row items-center px-4 py-3 border-b border-gray-200"
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

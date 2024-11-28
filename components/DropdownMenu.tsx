import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  Text,
  Pressable,
  Image
} from 'react-native';

const DropdownMenu = ({ onAlias, onChat }) => {
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
            <TouchableOpacity 
              onPress={() => {
                setVisible(false);
                onAlias();
              }}
              className="flex-row items-center px-4 py-3 border-b border-gray-200"
            >
              <Text className="font-Jakarta text-base">Alias</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => {
                setVisible(false);
                onChat();
              }}
              className="flex-row items-center px-4 py-3"
            >
              <Text className="font-Jakarta text-base">Chat</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default DropdownMenu;
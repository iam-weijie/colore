
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';


const RenameContainer = ({
  initialValue = '',
  onSave,
  onCancel,
  placeholder = 'Enter new name',
  maxCharacters = 20,
}) => {
  const [text, setText] = useState(initialValue);
   // Maximum number of characters allowed

  const handleChangeText = (text: string) => {
    if (text.length <= maxCharacters) {
      setText(text);
    } else {
      setText(text.substring(0, maxCharacters));


    }
  };

  return (
 
      <View className="flex-1 w-full flex items-center justify-center h-[50px]">

        {/* Text Input */}
        <TextInput
          className="flex-1 w-full text-[16px] text-black bg-gray-50 rounded-[24px] font-JakartaMedium py-2 px-4 mx-2 "
          value={text}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={"#757575"}
          autoFocus
          onBlur={onCancel}
        />
          
          <TouchableOpacity
            className="absolute rounded-full bg-black justify-center items-center mx-1 py-2 px-3 right-2 z-[999]"
            onPress={() => {
              console.log("[RenamingContainer]: Pressed!")
              onSave(text)
              }}
            disabled={!text.trim()}
          >
            <Text className="text-white font-JakartaSemiBold text-[14px]">Save</Text>
          </TouchableOpacity>
        </View>

  );
};

export default RenameContainer;

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
 
      <View className="flex-1 w-full flex items-between justify-between rounded-lg p-4 h-[400px] ">

        {/* Text Input */}
        <TextInput
          className="flex-1 text-[20px] text-black rounded-[24px] font-JakartaBold mx-10 "
          value={text}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          autoFocus
        />
        
        {/* Buttons */}
        <View className="flex-row justify-end space-x-2">
          <TouchableOpacity
           className="rounded-full bg-white justify-center items-center py-4 px-6"
           style={{
             shadowColor: "#505050",
             shadowOpacity: 0.15,
             shadowRadius: 6,
             shadowOffset: { width: 0, height: 3 }
           }}
            onPress={onCancel}
          >
            <Text className="text-black font-JakartaBold text-sm" >Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="rounded-full bg-black justify-center items-center mx-1 py-4 px-6"
            onPress={() => onSave(text)}
            disabled={!text.trim()}
          >
            <Text className="text-white font-JakartaBold text-sm">Save</Text>
          </TouchableOpacity>
        </View>
      </View>

  );
};

export default RenameContainer;
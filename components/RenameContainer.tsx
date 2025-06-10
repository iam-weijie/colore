
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import CustomButton from './CustomButton';


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

   const handleSubmit = () => {
    const cleanText = text.trim()
    if (cleanText) {
      console.log("[RenamingContainer]: Return pressed - saving!");
      onSave(cleanText);
    }
  };


    const handleCancel = () => {
    console.log("[RenamingContainer]: Cancel pressed!");
    onCancel();
  };

  return (
 
      <View className="flex flex-row items-center bg-white rounded-[32px] px-4 py-2 h-[48px] mx-2 mb-2 "
            style={{
              boxShadow: "0 0 7px 1px rgba(120,120,120,.1)"
            }}
            >
              <TextInput
                className="flex-1 pl-2 text-[14px] "
                value={text}
                onChangeText={handleChangeText}
                placeholder={placeholder}
                placeholderTextColor={"#757575"}
                autoFocus
                onBlur={handleCancel}
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
              />
                <View className="absolute right-1 w-[25%]">
                        <CustomButton
              title={"Cancel"}
              onPress={() => {}}
              fontSize="sm"
              padding={3}
            />
          </View>
            </View>

 

  );
};

export default RenameContainer;
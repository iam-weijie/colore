import React, { useState } from 'react';
import { View, Image, ImageSourcePropType, TouchableOpacity, Text, ScrollView } from 'react-native';
import { icons } from '@/constants';
import { TextStyle } from '@/types/type';




const RichTextEditor = ({ handleApplyStyle }: { handleApplyStyle: (style: TextStyle) => void}) => {

  const stylingBar = ['bold', 'italic', 'underline', 'H', 'ordered', 'unordered']
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const headerStyleOptions = ['h1', 'h2', 'h3', 'h4']
  const applyStyle = (newStyle: TextStyle) => {

    //if (start === end) return; // nothing selected

    if (newStyle === 'H') {
        console.log("clicked on H")
        setShowOptions((prev) => !prev)
        return
    } 
    handleApplyStyle(newStyle)

  };

  const styleContainer = (focused: boolean, icon: ImageSourcePropType) => {
    return (
        <View 
        className='p-3 rounded-[12px] mx-2'
        pointerEvents="none"
        style={{
            backgroundColor: focused ? "#eee" : "#fafafa"
        }}>
        <Image
        source={icon}
        className='w-4 h-4'
        resizeMode='contain'
        />
        </View>
    )
  }

  const headerStyleContainer = (focused: boolean, style: TextStyle) => {
    return (
        <View 
        className='p-4 rounded-[16px]'
        style={{
            backgroundColor: focused ? "#eee" : "#eee"
        }}>
            <Text>{style}</Text>
        </View>
    )
  }

  const getShortHand = (style: string) => {

    switch (style) {
        case "bold":
            return styleContainer(false, icons.bold);
        case "italic":
            return styleContainer(false, icons.italics);
        case "underline":
            return styleContainer(false, icons.underline);
        case "H":
            return styleContainer(false, icons.H);
        case "unordered":
            return styleContainer(false, icons.uList);
        case "ordered":
            return styleContainer(false, icons.oList);
    }
    

  }

  return (
    <View className="flex items-center justify-center h-[50px]">
      <ScrollView 
      horizontal 
      keyboardShouldPersistTaps="handled" 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingLeft: 24
      }}>
        {stylingBar.map((style) => (
            <View>
          <TouchableOpacity
            key={style}
            onPress={() => applyStyle(style as TextStyle)}
          >
            {getShortHand(style)}
          </TouchableOpacity>
         {showOptions && headerStyleOptions.map((style) =>
         {
            return headerStyleContainer(false, style)

         }
        )} 
        
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default RichTextEditor;
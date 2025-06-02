import React, { useState } from 'react';
import { View, Image, ImageSourcePropType, TouchableOpacity, Text, ScrollView } from 'react-native';
import { icons } from '@/constants';
import { TextStyle } from '@/types/type';




const RichTextEditor = ({ handleApplyStyle }: { handleApplyStyle: (style: TextStyle) => void}) => {

  const stylingBar = ['bold', 'italic', 'underline', 'H', 'ordered', 'unordered']
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const headerStyleOptions = ['h1', 'h2', 'h3']
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

  const headerStyleContainer = (focused: boolean, style: string) => {
    return (
        <TouchableOpacity 
        onPress={() => {
          applyStyle(style as TextStyle)
          setShowOptions(false)
        }}
        className=' mx-2 h-10 w-10 rounded-[12px] flex items-center justify-center'
        style={{
            backgroundColor: focused ? "#eee" : "#fafafa"
        }}>
            <Text className="text-lg font-JakartaBold">{style}</Text>
        </TouchableOpacity>
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
    <View className="flex items-center justify-center h-[50px] w-full">
      <ScrollView 
      horizontal 
      keyboardShouldPersistTaps="handled" 
      showsHorizontalScrollIndicator={false}>
        {!showOptions && stylingBar.map((style) => (
            <View>
          <TouchableOpacity
            key={style}
            onPress={() => applyStyle(style as TextStyle)}
          >
            {getShortHand(style)}
          </TouchableOpacity>
        
          </View>
        ))}
        {showOptions && headerStyleOptions.map((style) =>
         (
          <View>
            {headerStyleContainer(false, style)}
            </View>
         )
        )} 
      </ScrollView>
    </View>
  );
};

export default RichTextEditor;
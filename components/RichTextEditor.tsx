import React, { useState } from 'react';
import { View, Image, ImageSourcePropType, TouchableOpacity, Text, ScrollView } from 'react-native';
import { icons } from '@/constants';
import { TextStyle } from '@/types/type';
import InteractionButton from './InteractionButton';




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

  const styleContainer = (focused: boolean, icon: ImageSourcePropType, style: TextStyle) => {
    return (
      <View style={{ transform: "scale(0.7)"}}>
        <InteractionButton
        icon={icon}
        onPress={() => applyStyle(style as TextStyle)}
        size={"sm"} 
        label={''} 
        showLabel={false} 
        color={''}        
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
        className=' mx-2 h-10 w-10 rounded-full shadow-md flex items-center justify-center'
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
            return styleContainer(false, icons.bold, style);
        case "italic":
            return styleContainer(false, icons.italics, style);
        case "underline":
            return styleContainer(false, icons.underline, style);
        case "H":
            return styleContainer(false, icons.H, style);
        case "unordered":
            return styleContainer(false, icons.uList, style);
        case "ordered":
            return styleContainer(false, icons.oList, style);
    }
    

  }

  return (
    <View className="flex items-center justify-center h-[50px] ">
      <ScrollView 
      horizontal 
      keyboardShouldPersistTaps="handled" 
      showsHorizontalScrollIndicator={false}>
        {!showOptions && stylingBar.map((style) => (
            <View 
            key={style}>
            {getShortHand(style)}
          </View>
        ))}
        {showOptions && headerStyleOptions.map((style) =>
         (
          <View
          key={style}
          >
            {headerStyleContainer(false, style)}
            </View>
         )
        )} 
      </ScrollView>
    </View>
  );
};

export default RichTextEditor;
import React, { useState } from 'react';
import { View, Image, ImageSourcePropType, TouchableOpacity, Text, ScrollView } from 'react-native';
import { icons } from '@/constants';
import { Segment } from '@/types/type';
type TextStyle = 'bold' | 'italic' | 'underline' | 'H' | 'h1' | 'h2' | 'h3' | 'h4' | 'ordered' | 'unordered';



const RichTextEditor = ({start, end, handleComplete}: {start: number, end: number, handleComplete: () => void}) => {

  const stylingBar = ['bold', 'italic', 'underline', 'H', 'ordered', 'unordered']
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [headerStyleOptions, setHeaderStyleOption] = useState<TextStyle[]>(['h1', 'h2', 'h3', 'h4'])
  const applyStyle = (newStyle: TextStyle) => {

    //if (start === end) return; // nothing selected

    if (newStyle === 'H') {
        console.log("clicked on H")
        setShowOptions((prev) => !prev)
        return
    };

    const newSegment: Segment = { start, end, style: [newStyle] };
    return newSegment
  };

  const styleContainer = (focused: boolean, icon: ImageSourcePropType) => {
    return (
        <View 
        className='p-3 rounded-[12px] mx-2'
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
    <View className="flex items-center justify-center mb-4 h-[50px] pr-8">
      <ScrollView 
      horizontal 
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
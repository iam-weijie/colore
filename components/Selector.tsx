// components/RadioButton.tsx
import React, {useState, useEffect, useRef } from 'react';
import { ScrollView, Animated, Dimensions, FlatList, Image, View, Text, TouchableOpacity } from 'react-native';
import { RadioButtonProps } from '@/types/type';
import { images } from "@/constants/index";
import MaskedView from '@react-native-masked-view/masked-view';

const { width } = Dimensions.get('window');

export const RadioButton: React.FC<RadioButtonProps> = ({ label, selected, onSelect })=> {

    return(
        <TouchableOpacity
        className="flex-row items-center justify-start my-2"
        onPress={onSelect}>
            <View className={`flex-row items-center justify-center w-5 h-5 p-3 rounded-full z-[10]  border-2 ${selected ? 'border-black' : 'border-gray-400'}`}>
                {selected && 
                <View className='absolute -z-[1]'>
                  <MaskedView
                      style={{ width: 40, height: 40 }}
                        maskElement={
                    <Image
                      source={
                       images.highlight2
                      }
                      style={{
                        width: 40,
                        height: 40,
                      }}
                    />
                  }
                >
                  <View style={{ flex: 1, backgroundColor: "#93c5fd" }} />
                </MaskedView>
                </View>}
            </View>
            <Text className={`ml-2 text-[14px] ${selected ? 'text-black' : 'text-gray-400'}  font-JakartaBold`}>
                {label}
            </Text>
        </TouchableOpacity>
    )
}

export const UniqueSelection = ({ options, description, onSelect }) => {

    const [selected, setSelected] = useState<string>(options[0].label);
    const handleSelect = (option: string) => {
        setSelected(option)
        onSelect(option)
    }
    
    return (
        <View className="flex-1 mx-2 w-full mb-4">
            <Text className='text-center text-gray-400 text-[12px] mx-4 my-4'>
                {description}
            </Text>
            {options.map((option) => {
                return (
                <RadioButton
                label={option.label}
                selected={selected === option.label}
                onSelect={() => {handleSelect(option.label)}} />
            )
              
            })}
        </View>
    )

}


const { width: screenWidth } = Dimensions.get('window');
const ITEM_WIDTH = screenWidth * 0.3; // Each number takes 30% of screen width

export const NumberSelection = ({ maxNum, minNum, onSelect }) => {
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef(null);
  
    const numberList = Array.from({ length: maxNum - minNum + 1 }, (_, index) => minNum + index);
    const contentInset = (screenWidth - ITEM_WIDTH) / 2 - 20;

    // Initialize scroll position to first item
    useEffect(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({
          offset: 0,
          animated: false,
        });
      }
      onSelect?.(numberList[0]);
    }, []);

    const onScroll = Animated.event(
      [{ nativeEvent: { contentOffset: { x: scrollX } } }],
      { useNativeDriver: false }
    );
  
    useEffect(() => {
      const listener = scrollX.addListener(({ value }) => {
        const scrollPosition = value + contentInset;
        const index = Math.round(scrollPosition / ITEM_WIDTH);
        if (index >= 0 && index < numberList.length && index !== selectedIndex) {
          setSelectedIndex(index);
          onSelect(numberList[index]);
        }
      });
      
      return () => scrollX.removeListener(listener);
    }, [numberList]);
  
    const getScale = (index: number) => {
      const inputRange = [
        (index - 2) * ITEM_WIDTH,
        (index - 1) * ITEM_WIDTH,
        index * ITEM_WIDTH,
        (index + 1) * ITEM_WIDTH,
        (index + 2) * ITEM_WIDTH
      ];
      return scrollX.interpolate({
        inputRange: inputRange.map(x => x - contentInset),
        outputRange: [0.7, 0.85, 1.2, 0.85, 0.7],
        extrapolate: 'clamp',
      });
    };
  
    const getOpacity = (index: number) => {
      const inputRange = [
        (index - 1) * ITEM_WIDTH,
        index * ITEM_WIDTH,
        (index + 1) * ITEM_WIDTH
      ];
      return scrollX.interpolate({
        inputRange: inputRange.map(x => x - contentInset),
        outputRange: [0.5, 1, 0.5],
        extrapolate: 'clamp',
      });
    };
  
    return (
      <View className="flex-1 min-h-[120px]">
        <FlatList
          ref={flatListRef}
          data={numberList}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          contentInset={{ left: contentInset, right: contentInset }}
          contentOffset={{ x: -contentInset, y: 0 }}
          renderItem={({ item, index }) => (
            <View style={{ width: ITEM_WIDTH }} className="flex-row justify-center items-center">
              {selectedIndex === index && (
                 <View className='absolute z-1'>
                 <MaskedView
                   style={{ width: 75, height: 75 }}
                   maskElement={
                     <Image
                       source={
                          index % 4 === 1 ? images.highlight1
                          : ( index % 4 === 2 ? images.highlight2
                           : (index % 4 === 3 ? images.highlight3 
                               : images.highlight4 ))
                       }
                       style={{
                         width: 75,
                         height: 75,
                       }}
                     />
                   }
                 >
                   <View style={{ 
                       flex: 1, 
                   backgroundColor:  index % 4 === 1 ? "#ffe640"
                          : ( index % 4 === 2 ? "#fbb1d6"
                           : (index % 4 === 3 ? "#93c5fd"
                               : "#CFB1FB" ))}} />
                 </MaskedView>
               </View>
              )}
              
              <Animated.Text
                className="text-[48px] font-JakartaBold"
                style={{
                  transform: [{ scale: getScale(index) }],
                  opacity: getOpacity(index),
                }}>
                {item}
              </Animated.Text>
            </View>
          )}
          keyExtractor={(item) => item.toString()}
          onScroll={onScroll}
          scrollEventThrottle={16}
          getItemLayout={(data, index) => ({
            length: ITEM_WIDTH,
            offset: ITEM_WIDTH * index,
            index,
          })}
        />
      </View>
    );
};

  /*
     <MaskedView
  style={{ width: 100, height: 100 }}
  maskElement={
    <Image
      source={images.highlight1}
      style={{
        width: 100,
        height: 100,
      }}
    />
  }
>
  <View style={{ flex: 1, backgroundColor: '#FF6347' }} />
</MaskedView>
*/
import PostModal from "@/components/PostModal";
import { fetchAPI } from "@/lib/fetch";
import { Post, UserData } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  Animated,
  Dimensions,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const screenWidth = Dimensions.get('window').width;

declare interface CardCarrouselProps<T> {
    items: T[],
    renderItem: (item: T, index: number) => React.ReactNode,
    handleScrollBeginDrag?: () => void,
    inputRef?: TextInput, 
}

const CardCarrousel =  <T,>({ 
    items, 
    renderItem, 
    handleScrollBeginDrag, 
    inputRef 
}: CardCarrouselProps<T>) => {

    const scrollX = useRef(new Animated.Value(0)).current;

    return (
        <Animated.FlatList
            className="flex-1"
            data={items}
            keyExtractor={(item, index) =>
                index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ 
                paddingHorizontal: (screenWidth - screenWidth * 0.85) / 2,
                alignItems: "center"}}
            scrollEventThrottle={16}
            decelerationRate="fast"
            onScroll={
                Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )
    
          }
            onScrollBeginDrag={handleScrollBeginDrag} 
            snapToInterval={screenWidth * 0.85 + 12} // Width + gap
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            renderItem={({ item, index }) => {
              const inputRange = [
                (index - 1) * (screenWidth * 0.85 + 12),
                index * (screenWidth * 0.85 + 12),
                (index + 1) * (screenWidth * 0.85 + 12)
              ];

              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.92, 1, 0.92],
                extrapolate: 'clamp',
              });

              const shadowOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.1, 0.3, 0.1],
                extrapolate: 'clamp',
              });

return (
  <Animated.View
  className=" h-[85%]"
    style={{
      transform: [{ scale }],
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 12,
      elevation: 6, // Android shadow
      borderRadius: 32,
      
    }}
  >
{renderItem(item, index)}
  </Animated.View>
);
}}
/>)
}

export default CardCarrousel;
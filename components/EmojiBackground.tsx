import React, { useState, useEffect, useRef, useCallback } from "react";
import {Image, Modal, Pressable, Dimensions, Text, TouchableOpacity, View } from "react-native";
import { useGlobalContext } from "@/app/globalcontext";
import { EmojiBackgroundProps } from "@/types/type";
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get("window");

const EmojiBackground: React.FC<EmojiBackgroundProps> = ({ emoji, color }) => {

     const { isIpad } = useGlobalContext(); 

    
        const GRID_SIZE = isIpad ? 150 : 100; // Size of each square in the grid
        const OFFSET_X = 20; // Offset for odd rows
        const ITEMS_PER_ROW = isIpad ? 9 : 4; // Number of items per row
        const numColumns = ITEMS_PER_ROW;
        const numRows = Math.ceil(height / GRID_SIZE);
    
        // Generate positions for the grid
        const gridItems = [];
        for (let row = 0; row < numRows; row++) {
          for (let col = 0; col < numColumns; col++) {
            const offsetX = row % 2 === 1 ? OFFSET_X : 0; // Add offset for odd rows
            gridItems.push({
              x: col * GRID_SIZE + offsetX,
              y: row * GRID_SIZE,
            });
          }
        }
    
  
    

      return (
        <View 
        className="absolute w-full h-full"
        style={{
            backgroundColor: color
        }}>
          {gridItems.map((item, index) => (
            <View
              key={index}
              className="absolute align-center justify-center"
              style={{
                left: item.x,
                top: item.y,
                width: GRID_SIZE,
                height: GRID_SIZE,
              }}
            >
              <Text style={{ fontSize: 50 }}>{emoji}</Text>
            </View>
          ))}
        </View>
      );

};

export default EmojiBackground;
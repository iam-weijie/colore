import React, { useEffect, useRef } from "react";
import {
  Dimensions,
  Text,
  View,
  Animated,
  Easing,
} from "react-native";
import { useDevice } from "@/app/contexts/DeviceContext";
import { EmojiBackgroundProps } from "@/types/type";

const { width, height } = Dimensions.get("window");

const EmojiBackground: React.FC<EmojiBackgroundProps> = ({ emoji, color }) => {
  const { isIpad } = useDevice();
  
  const GRID_SIZE = isIpad ? 150 : 100;
  const OFFSET_X = 20;
  const ITEMS_PER_ROW = isIpad ? 9 : 4;
  const numColumns = ITEMS_PER_ROW;
  const numRows = Math.ceil(height / GRID_SIZE);
  
  // Create animated values for each emoji
  const gridItems = useRef(
    Array.from({ length: numRows * numColumns }, (_, index) => {
      const row = Math.floor(index / numColumns);
      const col = index % numColumns;
      const offsetX = row % 2 === 1 ? OFFSET_X : 0;
      
      return {
        baseX: col * GRID_SIZE + offsetX,
        baseY: row * GRID_SIZE,
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        rotation: new Animated.Value(0),
        // New animated values for enter animation
        enterScale: new Animated.Value(0.5),
        enterOpacity: new Animated.Value(0),
      };
    })
  ).current;

  // Enter animation (runs once when component mounts)
  useEffect(() => {
    const enterAnimations = gridItems.map((item, index) => {
      // Stagger the animations based on index for a wave-like effect
      const delay = index * 30;
      
      return Animated.parallel([
        Animated.timing(item.enterScale, {
          toValue: 1,
          duration: 800,
          delay,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(item.enterOpacity, {
          toValue: 0.9,
          duration: 600,
          delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]);
    });

    // Start all enter animations
    enterAnimations.forEach(anim => anim.start());
    
    return () => {
      enterAnimations.forEach(anim => anim.stop());
    };
  }, []);

  // Floating animation for all emojis (starts after enter animation)
  useEffect(() => {
    const animations = gridItems.map((item) => {
      // Very subtle movement parameters (3-8px)
      const distanceX = 3 + Math.random() * 5;
      const distanceY = 3 + Math.random() * 5;
      
      // Longer duration for smoother, less noticeable movement
      const duration = 4000 + Math.random() * 1000;
      const delay = 1000 + Math.random() * 3000; // Added initial delay to let enter animation finish
      
      // X-axis movement (very slow and subtle)
      const moveX = Animated.loop(
        Animated.sequence([
          Animated.timing(item.x, {
            toValue: distanceX,
            duration: duration/2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(item.x, {
            toValue: -distanceX,
            duration: duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(item.x, {
            toValue: 0,
            duration: duration/2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      
      // Y-axis movement (even slower)
      const moveY = Animated.loop(
        Animated.sequence([
          Animated.timing(item.y, {
            toValue: distanceY,
            duration: duration * 1.2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(item.y, {
            toValue: -distanceY,
            duration: duration * 1.5,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(item.y, {
            toValue: 0,
            duration: duration * 1.2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      
      // Very smooth rotation (-5 to 5 degrees)
      const rotate = Animated.loop(
        Animated.sequence([
          Animated.timing(item.rotation, {
            toValue: 1,
            duration: 1500 + Math.random() * 10000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(item.rotation, {
            toValue: -1,
            duration: 1500 + Math.random() * 10000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      
      // Start all animations with different delays
      setTimeout(() => {
        moveX.start();
        moveY.start();
        rotate.start();
      }, delay);
      
      return { moveX, moveY, rotate };
    });
    
    return () => {
      animations.forEach(anim => {
        anim.moveX.stop();
        anim.moveY.stop();
        anim.rotate.stop();
      });
    };
  }, []);

  return (
    <Animated.View 
      className="absolute w-full h-full"
      style={{ backgroundColor: color }}
    >
      {gridItems.map((item, index) => {
        const rotate = item.rotation.interpolate({
          inputRange: [-1, 1],
          outputRange: ['-5deg', '5deg'], // Very subtle rotation
        });
        
        return (
          <Animated.View
            key={index}
            className="absolute align-center justify-center"
            style={{
              left: item.baseX,
              top: item.baseY,
              width: GRID_SIZE,
              height: GRID_SIZE,
              transform: [
                { translateX: item.x },
                { translateY: item.y },
                { rotate },
                { scale: item.enterScale }, // Added scale transform for enter animation
              ],
              opacity: item.enterOpacity, // Added opacity for enter animation
            }}
          >
            <Text style={{ 
              fontSize: 50, 
              textAlign: 'center',
            }}>
              {emoji}
            </Text>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
};

export default EmojiBackground;
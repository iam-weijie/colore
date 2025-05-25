import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useGlobalContext } from "@/app/globalcontext";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const InteractionButton = ({ 
  label, 
  onPress, 
  showLabel,
  icon,
  emoji, 
  size = "sm",
  color,
  soundType,
  styling
}: { 
  label: string, 
  onPress: () => void, 
  showLabel: boolean,
  icon?: ImageSourcePropType, 
  emoji?: string,
  color: string,
  size: string,
  soundType?: SoundType,
  styling: string
}) => {
  // Get sound effects
  const { soundEffectsEnabled } = useGlobalContext();
  const { playSoundEffect } = useSoundEffects();
  
  // Animation values
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const yOffset = useSharedValue(100);

  // Enter animation
useEffect(() => {
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 100
    });
    opacity.value = withTiming(1, { duration: 300 });
    yOffset.value = withSpring(0, {
      damping: 15,
      stiffness: 120
    });
  }, []);

  // Press animation
  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, {
        damping: 5,
        stiffness: 300
      })
    );
    
    // Play sound effect if enabled and sound type is provided
    if (soundEffectsEnabled && soundType) {
      playSoundEffect(soundType);
    } else if (soundEffectsEnabled) {
      // Default sound based on label if no specific soundType provided
      if (label === 'Reply') {
        playSoundEffect(SoundType.Reply);
      } else if (label === 'Hard agree') {
        playSoundEffect(SoundType.Like);
      } else {
        playSoundEffect(SoundType.Button);
      }
    }
    
    onPress();
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: yOffset.value }
    ]
  }));

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <View >
      <Animated.View style={containerStyle}>
        <AnimatedTouchable
          onPress={handlePress}
          activeOpacity={0.9}
          className={`flex-row items-center justify-center ${size === "sm" ? "w-10 h-10" : (size === "md" ? "w-12 h-12" : "w-14 h-14")} rounded-full bg-white ${styling}`}
        >
        {emoji ? (
            <Animated.Text
              style={[emojiStyle, {
                fontSize: size === "sm" ? 24 : (size == "md" ? 32 : 36),
                includeFontPadding: false,  // Add this to prevent extra padding
                textAlignVertical: 'center' // Ensure proper vertical alignment
              }]}
            >
             {emoji}
            </Animated.Text>
          ) : (
            <Image  
              source={icon}
              className="w-6 h-6"
              tintColor={color}
            />
        )}
        </AnimatedTouchable>
      </Animated.View>
      
      {showLabel && <Animated.Text 
        className="text-[12px] font-JakartaSemiBold shadow-md text-white mt-2"
        style={{ opacity: opacity.value }}
      >
        {label}
      </Animated.Text>}
    </View>
  );
};

export default InteractionButton;
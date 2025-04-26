import React, { useEffect, useState } from "react";
import { View, Image, Text, TouchableOpacity } from "react-native";
import { Stacks } from "@/types/type";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate
} from "react-native-reanimated";
import { icons } from "@/constants";
import PinIcon from "./PinComponent";
import { isOnlyEmoji } from "@/lib/post";

interface StackCircleProps {
  stack: Stacks;
  isActive?: boolean;
  isEditable?: boolean;
  scrollOffset?: { x: number; y: number };
  onViewPress?: () => void;
  onEditPress?: () => void;
  onSendPress?: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const StackCircle: React.FC<StackCircleProps> = ({ 
  stack, 
  isEditable = false,
  scrollOffset = { x: 0, y: 0 },
  onViewPress,
  onEditPress,
  onSendPress
}) => {
  const SHOW_BUTTONS_THRESHOLD = 200;
  const buttonsVisibility = useSharedValue(0);
  const [isFocused, setIsFocused] = useState(false);

  // Calculate if buttons should be visible
  const shouldShowButtons = () => {
    const dx = Math.abs((scrollOffset.x + 120) - stack.center.x);
    const dy = Math.abs((scrollOffset.y + 160) - stack.center.y);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= SHOW_BUTTONS_THRESHOLD) {
      setIsFocused(true);
    } else {
      setIsFocused(false);
    }

    return (isEditable && distance <= SHOW_BUTTONS_THRESHOLD);
  };

  // Animate buttons visibility
  useEffect(() => {
    buttonsVisibility.value = withTiming(shouldShowButtons() ? 1 : 0, {
      duration: 300
    });
  }, [scrollOffset.x, scrollOffset.y, isEditable]);

  // Button container animation
  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsVisibility.value,
    transform: [{ translateY: interpolate(buttonsVisibility.value, [0, 1], [20, 0]) }]
  }));

  return (
    <View
      pointerEvents={isFocused ? "auto" : "none"}
      className="absolute items-center justify-center rounded-[48px] border-6 bg-white/90 border-white/80"
      style={{
        left: stack.center.x - 40,
        top: stack.center.y - 110,
        width: 240,
        height: 320,
        shadowColor: "#9CA3AF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        zIndex: isFocused ? 999 : 1,
      }}
    >
      {/* Pin Component */}
      <View className="absolute top-0 w-full mx-auto items-center">
      <PinIcon
       size={40}
        />
      </View>
      {/* Stack Name */}
      <Text 
        className="absolute top-12 w-full px-6 text-center text-black font-JakartaBold"
        numberOfLines={2}
        ellipsizeMode="tail"
        style={{
          fontSize: isOnlyEmoji(stack.name) ? 40 : 20
        }}
      >
        {stack.name}
      </Text>
      

      {/* Action Buttons */}
      <Animated.View
        className="absolute -bottom-[25px] flex-row justify-end items-center"
        style={buttonsStyle}
      >
        {/* View Button */}
        <AnimatedTouchable
          activeOpacity={0.7}
          onPress={onViewPress}
          className="rounded-full bg-black justify-center items-center mx-1"
          style={{
            width: 100,
            height: 50,
            shadowColor: "#505050",
            shadowOpacity: 0.15,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 }
          }}
        >
          <Text className="text-white font-JakartaBold" style={{ fontSize: 16 }}>
            View
          </Text>
        </AnimatedTouchable>

        {/* Edit/Delete Buttons - Only show when editable */}
        {isEditable && (
          <>
            <AnimatedTouchable
              activeOpacity={0.7}
              onPress={onEditPress}
              className="rounded-full bg-white justify-center items-center mx-1"
              style={{
                width: 50,
                height: 50,
                shadowColor: "#505050",
                shadowOpacity: 0.15,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 }
              }}
            >
              <Image
                source={icons.pencil}
                tintColor="black"
                resizeMode="contain"
                className="w-5 h-5"
              />
            </AnimatedTouchable>

            <AnimatedTouchable
              activeOpacity={0.7}
              onPress={onSendPress}
              className="rounded-full bg-white justify-center items-center mx-1"
              style={{
                width: 50,
                height: 50,
                shadowColor: "#505050",
                shadowOpacity: 0.15,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 }
              }}
            >
              <Image
                source={icons.send}
                tintColor="black"
                resizeMode="contain"
                className="w-5 h-5"
              />
            </AnimatedTouchable>
          </>
        )}
      </Animated.View>
    </View>
  );
};

export default StackCircle;
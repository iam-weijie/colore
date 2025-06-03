import { ButtonProps } from "@/types/type";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  Easing
} from "react-native-reanimated";
import { SoundType, useSoundEffects } from "@/hooks/useSoundEffects";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const getBgVariantStyle = (
  variant: ButtonProps["bgVariant"],
  disabled: boolean
) => {
  if (disabled) {
    return "bg-gray-400";
  }

  switch (variant) {
    case "primary":
      return "bg-[#FFFFFF]";
    case "secondary":
      return "bg-black";
    case "danger":
      return "bg-red-500";
    case "success":
      return "bg-green-500";
    case "outline":
      return "bg-transparent border-neutral-300 border-[0.5px]";
    case "gradient":
      return ["#ffd12b", "#ff9f45"];
    case "gradient2":
      return ["#54C1EE", "#91C5FC", "#54C1EE"];
    case "gradient3":
      return ["#FFB85A", "#FF8864", "#FFB85A"];
    case "gradient4":
      return ["#FF99CC", "#FFCCF2", "#FF99CC"];
    default:
      return "bg-[#333333]";
  }
};

const getTextVariantStyle = (
  variant: ButtonProps["textVariant"],
  disabled: boolean
) => {
  if (disabled) {
    return "text-gray-300";
  }

  switch (variant) {
    case "primary":
      return "text-black";
    case "secondary":
      return "text-white";
    case "danger":
      return "text-red-100";
    case "success":
      return "text-green-100";
    default:
      return "text-white";
  }
};

const CustomButton = ({
  onPress,
  title,
  bgVariant = "primary",
  textVariant = "default",
  IconLeft,
  IconRight,
  className,
  disabled = false,
  fontSize = "2xl",
  padding = "4",
  ...props
}: ButtonProps) => {
  const { playSoundEffect } = useSoundEffects();
  
  // Animation values
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.2);
  const shadowRadius = useSharedValue(4);
  const brightness = useSharedValue(1);
  const textScale = useSharedValue(1);
  
  const bgStyle = getBgVariantStyle(bgVariant, disabled);
  const isGradient = ["gradient", "gradient2", "gradient3", "gradient4"].includes(bgVariant);

  // Main container animation
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: disabled ? 0.7 : interpolate(brightness.value, [0.9, 1], [0.9, 1]),
      shadowOpacity: shadowOpacity.value,
      shadowRadius: shadowRadius.value,
      shadowOffset: {
        width: 0,
        height: interpolate(scale.value, [0.92, 1], [1, 3]),
      },
    };
  });

  // Text animation
  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: textScale.value }],
    };
  });

  // Gradient animation (for gradient buttons)
  const gradientAnimatedStyle = useAnimatedStyle(() => {
    if (!isGradient) return {};
    
    return {
      opacity: brightness.value,
      transform: [{ scale: interpolate(scale.value, [0.88, 1], [0.92, 1]) }],
    };
  });

  const handlePressIn = () => {
    if (!disabled) {
      // Play sound effect
      runOnJS(playSoundEffect)(SoundType.Button);
      
      // Main button scale down with bounce
      scale.value = withSpring(0.88, {
        damping: 20,
        stiffness: 150,
        mass: 0.8,
      });
      
      // Enhance shadow for depth
      shadowOpacity.value = withTiming(0.4, {
        duration: 150,
        easing: Easing.out(Easing.quad),
      });
      shadowRadius.value = withTiming(8, {
        duration: 150,
        easing: Easing.out(Easing.quad),
      });
      
      // Slight brightness decrease for press feedback
      brightness.value = withTiming(0.9, {
        duration: 100,
        easing: Easing.out(Easing.quad),
      });
      
      // Text slight scale for tactile feedback
      textScale.value = withSpring(0.92, {
        damping: 25,
        stiffness: 200,
      });
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      // Scale back up with satisfying bounce
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 100,
        mass: 0.8,
      });
      
      // Reset shadow
      shadowOpacity.value = withTiming(0.2, {
        duration: 200,
        easing: Easing.out(Easing.quad),
      });
      shadowRadius.value = withTiming(4, {
        duration: 200,
        easing: Easing.out(Easing.quad),
      });
      
      // Reset brightness
      brightness.value = withTiming(1, {
        duration: 150,
        easing: Easing.out(Easing.quad),
      });
      
      // Reset text scale
      textScale.value = withSpring(1, {
        damping: 20,
        stiffness: 150,
      });
    }
  };

  return (
    <AnimatedTouchable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={1} // We handle opacity with animations
      style={[
        animatedStyle,
        {
          shadowColor: '#000',
          elevation: 5, // Android shadow
        }
      ]}
      className={`w-full rounded-full ${
        isGradient ? "" : bgStyle
      } p-${isGradient ? "" : padding} flex flex-row justify-center items-center ${className}`}
      {...props}
    >
      {isGradient && Array.isArray(bgStyle) ? (
        <AnimatedLinearGradient
          colors={bgStyle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={gradientAnimatedStyle}
          className={`flex flex-row justify-center items-center w-full h-full p-${padding} rounded-full`}
        >
          {IconLeft && (
            <Animated.View style={textAnimatedStyle}>
              <IconLeft />
            </Animated.View>
          )}
          <Animated.Text
            style={textAnimatedStyle}
            className={`font-bold text-${fontSize} ${getTextVariantStyle(
              textVariant,
              disabled
            )}`}
          >
            {title}
          </Animated.Text>
          {IconRight && (
            <Animated.View style={textAnimatedStyle}>
              <IconRight />
            </Animated.View>
          )}
        </AnimatedLinearGradient>
      ) : (
        <>
          {IconLeft && (
            <Animated.View style={textAnimatedStyle}>
              <IconLeft />
            </Animated.View>
          )}
          <Animated.Text
            style={textAnimatedStyle}
            className={`font-bold text-${fontSize} ${getTextVariantStyle(
              textVariant,
              disabled
            )}`}
          >
            {title}
          </Animated.Text>
          {IconRight && (
            <Animated.View style={textAnimatedStyle}>
              <IconRight />
            </Animated.View>
          )}
        </>
      )}
    </AnimatedTouchable>
  );
};

export default CustomButton;
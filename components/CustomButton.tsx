import { ButtonProps } from "@/types/type";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { SoundType, useSoundEffects } from "@/hooks/useSoundEffects";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const getBgVariantStyle = (variant, disabled) => {
  if (disabled) return "bg-gray-400";

  switch (variant) {
    case "primary": return "bg-[#FFFFFF]";
    case "secondary": return "bg-black";
    case "danger": return "bg-red-500";
    case "success": return "bg-green-500";
    case "outline": return "bg-transparent border-neutral-300 border-[0.5px]";
    case "gradient": return ["#ffd12b", "#ff9f45"];
    case "gradient2": return ["#54C1EE", "#91C5FC", "#54C1EE"];
    case "gradient3": return ["#FFB85A", "#FF8864", "#FFB85A"];
    case "gradient4": return ["#FF99CC", "#FFCCF2", "#FF99CC"];
    default: return "bg-[#333333]";
  }
};

const getTextVariantStyle = (variant, disabled) => {
  if (disabled) return "text-gray-300";

  switch (variant) {
    case "primary": return "text-black";
    case "secondary": return "text-white";
    case "danger": return "text-red-100";
    case "success": return "text-green-100";
    default: return "text-black";
  }
};

const fontSizeMap = {
  sm: "text-[12px]",
  md: "text-[14px]",
  lg: "text-[16px]",
  xl: "text-[18px]",
};

const paddingMap = {
  sm: "p-2",
  md: "p-3",
  lg: "p-4",
  xl: "p-5",
};

const CustomButton = ({
  onPress,
  title,
  bgVariant = "primary",
  textVariant = "default",
  IconLeft,
  IconRight,
  className = "",
  disabled = false,
  fontSize = "lg",
  padding = "lg",
}: ButtonProps) => {
  const { playSoundEffect } = useSoundEffects();

  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.2);
  const shadowRadius = useSharedValue(4);
  const brightness = useSharedValue(1);
  const textScale = useSharedValue(1);

  const bgStyle = getBgVariantStyle(bgVariant, disabled);
  const isGradient = Array.isArray(bgStyle);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.7 : interpolate(brightness.value, [0.9, 1], [0.9, 1]),
    shadowOpacity: shadowOpacity.value,
    shadowRadius: shadowRadius.value,
    shadowOffset: { width: 0, height: interpolate(scale.value, [0.92, 1], [1, 3]) },
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
  }));

  const gradientAnimatedStyle = useAnimatedStyle(() =>
    isGradient
      ? {
          opacity: brightness.value,
          transform: [{ scale: interpolate(scale.value, [0.92, 1], [0.92, 1]) }],
        }
      : {}
  );

  const handlePressIn = () => {
    if (disabled) return;
    runOnJS(playSoundEffect)(SoundType.Button);
    scale.value = withSpring(0.92, { damping: 20, stiffness: 150, mass: 0.8 });
    shadowOpacity.value = withTiming(0.4, { duration: 150, easing: Easing.out(Easing.quad) });
    shadowRadius.value = withTiming(8, { duration: 150, easing: Easing.out(Easing.quad) });
    brightness.value = withTiming(0.92, { duration: 100, easing: Easing.out(Easing.quad) });
    textScale.value = withSpring(0.92, { damping: 25, stiffness: 200 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 100, mass: 0.8 });
    shadowOpacity.value = withTiming(0.2, { duration: 200, easing: Easing.out(Easing.quad) });
    shadowRadius.value = withTiming(4, { duration: 200, easing: Easing.out(Easing.quad) });
    brightness.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) });
    textScale.value = withSpring(1, { damping: 20, stiffness: 150 });
  };

  return (
    <AnimatedTouchable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={1}
      style={[
        animatedStyle,
        {
          width: "50%",
          shadowColor: "rgba(10,10,10,0.15)",
          shadowRadius: 5,
        },
      ]}
      className={`relative w-full rounded-full ${isGradient ? "" : bgStyle} ${
        isGradient ? "" : paddingMap[padding]
      } flex flex-row justify-center items-center ${className} py-4`}
    >
      <View 
      className="absolute"
      style={{
        filter: blur(5)
      }} />
      {isGradient && Array.isArray(bgStyle) ? (
        <AnimatedLinearGradient
          colors={bgStyle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={gradientAnimatedStyle}
          className={`flex flex-row justify-center items-center w-full h-full ${paddingMap[padding]} rounded-full`}
        >
          {IconLeft && <Animated.View style={textAnimatedStyle}><IconLeft /></Animated.View>}
          <Animated.Text
            style={textAnimatedStyle}
            className={`font-JakartaSemiBold ${fontSizeMap[fontSize]} ${getTextVariantStyle(
              textVariant,
              disabled
            )}`}
          >
            {title}
          </Animated.Text>
          {IconRight && <Animated.View style={textAnimatedStyle}><IconRight /></Animated.View>}
        </AnimatedLinearGradient>
      ) : (
        <>
          <Animated.View
            className="w-full h-full rounded-full py-6"
            style={[
              {
                position: "absolute",
                backgroundColor: "#ffffff10",
                borderColor: "#ffffff60",
                borderWidth: 2,
              },
              animatedStyle,
            ]}
          />
          {IconLeft && <Animated.View style={textAnimatedStyle}><IconLeft /></Animated.View>}
          <Animated.Text
            style={textAnimatedStyle}
            className={`font-JakartaSemiBold ${fontSizeMap[fontSize]} ${getTextVariantStyle(
              textVariant,
              disabled
            )}`}
          >
            {title}
          </Animated.Text>
          {IconRight && <Animated.View style={textAnimatedStyle}><IconRight /></Animated.View>}
        </>
      )}
    </AnimatedTouchable>
  );
};

export default CustomButton;

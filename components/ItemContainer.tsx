import React, {useEffect} from "react";
import {
  Image,
  ImageSourcePropType,
  Text,
  View,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ItemContainer = ({
  label,
  caption,
  icon,
  colors,
  iconColor,
  actionIcon,
  onPress,
}: {
  label: string;
  caption?: string;
  icon: ImageSourcePropType;
  colors: [string, string, ...string[]];
  iconColor: string;
  actionIcon?: ImageSourcePropType;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0); // 👈 Start at 0
  const translateY = useSharedValue(20);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));


  useEffect(() => {
    // Animate in on mount
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withSpring(0, { damping: 12 });
  }, []);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, {
      damping: 10,
      stiffness: 200,
    });
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    opacity.value = withTiming(1, { duration: 100 });
  };

  return (
    <AnimatedPressable
  onPress={onPress}
  onPressIn={handlePressIn}
  onPressOut={handlePressOut}
  className="relative mb-4 w-full overflow-hidden rounded-[24px] px-4 py-4"
  style={[
    animatedStyle,
    {
      backgroundColor: "#FAFAFA",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 3, // Android
    },
  ]}
>
  {/* Highlight effect when pressed 
  {isPressed && (
    <Animated.View
      className="absolute inset-0 bg-white/20"
      style={{ opacity: pressAnimation }}
    />
  )}*/}

  <View className="flex-row items-center w-full">
    {/* Icon with gradient ring */}
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-[18px] p-[2px] mr-4 w-[48px] h-[48px] justify-center items-center"
    >
      <View className="w-full h-full bg-white/10 rounded-[16px] justify-center items-center">
        <Image
          source={icon}
          className="w-6 h-6"
          style={{ tintColor: "#FAFAFA" }}
          resizeMode="contain"
        />
      </View>
    </LinearGradient>

    {/* Text content */}
    <View className="flex-1 mr-2">
      <Text
        className="text-base font-JakartaSemiBold text-gray-900"
        ellipsizeMode="tail"
      >
        {label}
      </Text>
      {caption && (
        <Text
          className="text-xs mt-1 text-gray-500 font-Jakarta leading-[16px]"
          numberOfLines={2}
        >
          {caption}
        </Text>
      )}
    </View>

    {/* Action icon on the right */}
    {actionIcon && (
      <View className="ml-2 p-2 rounded-full bg-[#F1F1F1]">
        <Image
          source={actionIcon}
          className="w-5 h-5"
          style={{ tintColor: iconColor || "#6b7280" }}
          resizeMode="contain"
        />
      </View>
    )}
  </View>
</AnimatedPressable>

  );
};



export default ItemContainer;

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
import { SoundType, useSoundEffects } from "@/hooks/useSoundEffects";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ItemContainer = ({
  label,
  caption,
  icon,
  colors,
  iconColor,
  actionIcon,
  onPress,
  isPrompt = false,
}: {
  label: string;
  caption?: string;
  icon: ImageSourcePropType;
  colors: [string, string, ...string[]];
  iconColor: string;
  actionIcon?: ImageSourcePropType;
  onPress: () => void;
  isPrompt?: boolean;
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const { playSoundEffect } = useSoundEffects();
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withSpring(0, { damping: 12 });
  }, []);

  const handlePressIn = () => {
    playSoundEffect(SoundType.Button)
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
      className="relative mb-3 w-full overflow-hidden rounded-[20px] p-4"
      style={[
        animatedStyle,
        {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        },
      ]}
    >
      <View className="flex-row items-center w-full">
        {/* Icon with gradient ring - made smaller */}
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-[14px] p-[1.5px] mr-3 w-[40px] h-[40px] justify-center items-center"
        >
          <View className="w-full h-full bg-white/10 rounded-[12px] justify-center items-center">
            <Image
              source={icon}
              className="w-5 h-5" // Reduced icon size
              style={{ tintColor: "#FFFFFF" }}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>

        {/* Text content */}
        <View className="flex-1 mr-2">
          <Text
            className={`text-[15px] font-JakartaSemiBold ${isPrompt ? "text-white" : "text-black"}`}
            ellipsizeMode="tail"
            numberOfLines={isPrompt ? 3 : 1}
          >
            {label}
          </Text>
          {caption && (
            <Text
              className="text-xs mt-0.5 text-gray-500 font-Jakarta leading-[16px]"
              numberOfLines={2}
            >
              {caption}
            </Text>
          )}
        </View>

        {/* Action icon on the right */}
        {actionIcon && (
          <View className="ml-2 p-1.5 rounded-full bg-gray-100">
            <Image
              source={actionIcon}
              className="w-4 h-4" // Made slightly smaller
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
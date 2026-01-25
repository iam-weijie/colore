import React, { useEffect } from "react";
import {
  Image,
  ImageSourcePropType,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
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
  styling,
}: {
  label: string;
  onPress: () => void;
  showLabel: boolean;
  icon?: ImageSourcePropType;
  emoji?: string;
  color: string;
  size: string;
  soundType?: SoundType;
  styling: string;
}) => {
  const { soundEffectsEnabled } = useGlobalContext();
  const { playSoundEffect } = useSoundEffects();

  // Shared animation values
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  const yOffset = useSharedValue(30); // smaller for faster entry

  // Entry animation (simplified)
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    yOffset.value = withSpring(0, { damping: 12, stiffness: 100 });
    scale.value = withSpring(1, { damping: 10, stiffness: 90 });
  }, []);

  // Press animation and sound
  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.94, { duration: 60 }),
      withSpring(1, { damping: 6, stiffness: 200 })
    );

    if (soundEffectsEnabled) {
      const fallbackSound: SoundType =
        soundType ||
        (label === "Reply"
          ? SoundType.Reply
          : label === "Hard agree"
          ? SoundType.Like
          : SoundType.Button);

      playSoundEffect(fallbackSound);
    }

    onPress();
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: yOffset.value },
    ],
  }));

  return (
    <View>
      <Animated.View style={containerStyle}>
        <AnimatedTouchable
          onPress={handlePress}
          activeOpacity={0.9}
          className={`flex-row items-center justify-center ${
            size === "sm"
              ? "w-10 h-10"
              : size === "md"
              ? "w-12 h-12"
              : "w-14 h-14"
          } rounded-full bg-white ${styling}`}
        >
          {emoji ? (
            <Animated.Text
              style={{
                fontSize: size === "sm" ? 24 : size === "md" ? 32 : 36,
                includeFontPadding: false,
                textAlignVertical: "center",
                transform: [{ scale: scale.value }],
              }}
            >
              {emoji}
            </Animated.Text>
          ) : (
            <Image source={icon} className="w-6 h-6" tintColor={color} />
          )}
        </AnimatedTouchable>
      </Animated.View>

      {showLabel && (
        <Animated.Text
          className="text-[12px] font-JakartaSemiBold shadow-md text-white mt-2"
          style={{ opacity: opacity.value }}
        >
          {label}
        </Animated.Text>
      )}
    </View>
  );
};

export default InteractionButton;

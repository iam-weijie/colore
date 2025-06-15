import React, { useEffect, useMemo, useCallback } from "react";
import {
  Image,
  ImageSourcePropType,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import { useSettingsContext } from "@/app/contexts/SettingsContext";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Memoized size configurations to avoid recalculation
const SIZE_CONFIGS = {
  sm: { width: 40, height: 40, fontSize: 24, iconSize: 24 },
  md: { width: 48, height: 48, fontSize: 32, iconSize: 24 },
  lg: { width: 56, height: 56, fontSize: 36, iconSize: 24 },
} as const;

// Memoized animation configs
const ANIMATION_CONFIG = {
  entry: {
    opacity: { duration: 200 },
    spring: { damping: 12, stiffness: 100 },
    scale: { damping: 10, stiffness: 90 },
  },
  press: {
    scale: { duration: 60 },
    bounce: { damping: 6, stiffness: 200 },
  },
} as const;

interface InteractionButtonProps {
  label: string;
  onPress: () => void;
  showLabel: boolean;
  icon?: ImageSourcePropType;
  emoji?: string;
  color: string;
  size?: keyof typeof SIZE_CONFIGS;
  soundType?: SoundType;
  styling?: string;
}

const InteractionButton = React.memo(({
  label,
  onPress,
  showLabel,
  icon,
  emoji,
  size = "sm",
  color,
  soundType,
  styling = "",
}: InteractionButtonProps) => {
  const { soundEffectsEnabled } = useSettingsContext();
  const { playSoundEffect } = useSoundEffects();

  // Memoized size config
  const sizeConfig = useMemo(() => SIZE_CONFIGS[size], [size]);

  // Memoized fallback sound calculation
  const fallbackSound = useMemo((): SoundType => {
    if (soundType) return soundType;
    
    switch (label) {
      case "Reply":
        return SoundType.Reply;
      case "Hard agree":
        return SoundType.Like;
      default:
        return SoundType.Button;
    }
  }, [label, soundType]);

  // Shared animation values with initial values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const yOffset = useSharedValue(30);

  // Entry animation (only run once)
  useEffect(() => {
    opacity.value = withTiming(1, ANIMATION_CONFIG.entry.opacity);
    yOffset.value = withSpring(0, ANIMATION_CONFIG.entry.spring);
    scale.value = withSpring(1, ANIMATION_CONFIG.entry.scale);
  }, []);

  // Memoized sound effect handler
  const playSoundCallback = useCallback(() => {
    if (soundEffectsEnabled) {
      playSoundEffect(fallbackSound);
    }
  }, [soundEffectsEnabled, playSoundEffect, fallbackSound]);

  // Optimized press handler
  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withTiming(0.94, ANIMATION_CONFIG.press.scale),
      withSpring(1, ANIMATION_CONFIG.press.bounce, () => {
        runOnJS(onPress)();
      })
    );
    
    // Play sound immediately, don't wait for animation
    playSoundCallback();
  }, [scale, onPress, playSoundCallback]);

  // Memoized animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: yOffset.value },
    ],
  }), []);

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }), []);

  // Memoized container style
  const touchableStyle = useMemo(() => ({
    width: sizeConfig.width,
    height: sizeConfig.height,
    borderRadius: sizeConfig.width / 2,
    backgroundColor: 'white',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    // Apply custom styling if provided
    ...(styling ? { className: styling } : {}),
  }), [sizeConfig, styling]);

  // Memoized emoji style
  const emojiStyle = useMemo(() => ({
    fontSize: sizeConfig.fontSize,
    includeFontPadding: false,
    textAlignVertical: 'center' as const,
  }), [sizeConfig.fontSize]);

  return (
    <View>
      <Animated.View style={containerStyle}>
        <AnimatedTouchable
          onPress={handlePress}
          activeOpacity={0.9}
          style={touchableStyle}
        >
          {emoji ? (
            <Text style={emojiStyle}>
              {emoji}
            </Text>
          ) : (
            <Image 
              source={icon} 
              style={{ 
                width: sizeConfig.iconSize, 
                height: sizeConfig.iconSize,
                tintColor: color 
              }} 
            />
          )}
        </AnimatedTouchable>
      </Animated.View>
      
      {showLabel && (
        <Animated.Text
          style={[
            {
              fontSize: 12,
              fontWeight: '600',
              color: 'white',
              marginTop: 8,
              textAlign: 'center',
            },
            textStyle,
          ]}
        >
          {label}
        </Animated.Text>
      )}
    </View>
  );
});

InteractionButton.displayName = 'InteractionButton';

export default InteractionButton;
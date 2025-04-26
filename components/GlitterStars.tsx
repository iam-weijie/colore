import React, { useEffect, useState } from 'react';
import { View , StyleSheet
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  runOnJS
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

const GlitterStar = ({
  size = 16,
  color = '#FFD700',
  duration = 2000,
  onComplete,
}: {
  size?: number;
  color?: string;
  duration?: number;
  onComplete?: () => void;
}) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withTiming(-100, { duration });
    opacity.value = withDelay(duration * 0.5, withTiming(0, { duration: duration * 0.5 }, (finished) => {
      if (finished && onComplete) runOnJS(onComplete)();
    }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ position: 'absolute' }, animatedStyle]}>
      <Svg width={size} height={size} viewBox="0 0 16 16">
        <Line x1="8" y1="0" x2="8" y2="16" stroke={color} strokeWidth="1.5" />
        <Line x1="0" y1="8" x2="16" y2="8" stroke={color} strokeWidth="1.5" />
      </Svg>
    </Animated.View>
  );
};

export const GlitterEmitter = ({
    count = 8,
    colors = ['#FFD700', '#FF69B4', '#B0E0E6'],
  }: {
    count?: number;
    colors?: string[];
  }) => {
    const [glitters, setGlitters] = useState(
      Array.from({ length: count }, (_, i) => ({ id: i }))
    );
  
    const removeGlitter = (id: number) => {
      setGlitters((prev) => prev.filter((g) => g.id !== id));
    };
  
    return (
      <View style={StyleSheet.absoluteFill}>
        {glitters.map((glitter) => {
          const left = Math.random() * 200; // adjust as needed
          const color = colors[Math.floor(Math.random() * colors.length)];
          return (
            <View key={glitter.id} style={{ position: 'absolute', left }}>
              <GlitterStar
                color={color}
                onComplete={() => removeGlitter(glitter.id)}
              />
            </View>
          );
        })}
      </View>
    );
  };
  

import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  withTiming,
  withRepeat,
  useAnimatedStyle,
  useAnimatedProps,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ColoreActivityIndicator = ({
  text = 'Loading...',
  size = 40,
  strokeWidth = 6,
  colors = ['#ffe640', '#FBB1F5', '#93c5fd', '#CFB1FB'],
}: {
  text?: string;
  size?: number;
  strokeWidth?: number;
  colors?: string[];
}) => {
  const rotation = useSharedValue(0);
  const colorProgress = useSharedValue(0);

  useEffect(() => {
    // Single smooth rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1
    );

    // Simple color cycling
    colorProgress.value = withRepeat(
      withTiming(colors.length - 1, { duration: 3000, easing: Easing.linear }),
      -1
    );
  }, [colors.length]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Simplified arc props with just color animation
  const getArcProps = (index: number) =>
    useAnimatedProps(() => {
      const colorIndex = (colorProgress.value + index) % colors.length;
      const stroke = interpolateColor(
        colorIndex,
        colors.map((_, i) => i),
        colors
      );
      
      return { stroke };
    });

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Simple dot animation - just vertical bounce
  const getDotStyle = (index: number) =>
    useAnimatedStyle(() => {
      const phase = (rotation.value + index * 90) * (Math.PI / 180);
      const translateY = Math.sin(phase) * 4;
      
      return {
        transform: [{ translateY }],
        backgroundColor: colors[index % colors.length],
        opacity: 0.6 + 0.4 * Math.sin(phase),
      };
    });

  return (
    <View className="items-center justify-center space-y-3">
      {/* Simplified spinner - 3 arcs with staggered colors */}
      <Animated.View style={[{ width: size, height: size }, spinnerStyle]}>
        <Svg width={size} height={size}>
          {[0, 120, 240].map((angle, i) => (
            <AnimatedCircle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference * 0.25} ${circumference}`}
              strokeLinecap="round"
              fill="none"
              animatedProps={getArcProps(i)}
              rotation={angle}
              originX={size / 2}
              originY={size / 2}
            />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
};

export default ColoreActivityIndicator;
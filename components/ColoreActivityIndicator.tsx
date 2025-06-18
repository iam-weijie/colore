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
  size = 50,
  strokeWidth = 6,
  colors = ['#ffe640', '#FBB1F5', '#93c5fd', '#CFB1FB'],
}: {
  text?: string;
  size?: number;
  strokeWidth?: number;
  colors?: string[];
}) => {
  const rotation = useSharedValue(0);
  const colorCycle = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1
    );
    colorCycle.value = withRepeat(
      withTiming(colors.length, { duration: 4000, easing: Easing.linear }),
      -1
    );
  }, []);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const arcAngles = [0, 120, 240]; // rotation offsets
  const arcLengthRatio = 0.25; // 25% of the circle

  const getArcProps = (index: number) =>
    useAnimatedProps(() => {
      const stroke = interpolateColor(
        (colorCycle.value + index) % colors.length,
        colors.map((_, i) => i),
        colors
      );

      return {
        stroke,
      };
    });

  const containerSpin = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Bouncing dots
  const getDotStyle = (index: number) =>
    useAnimatedStyle(() => {
      const phase = (rotation.value + index * 120) * (Math.PI / 180);
      return {
        transform: [{ translateY: Math.sin(phase) * 4 }],
        opacity: 0.6 + 0.3 * Math.sin(phase),
        backgroundColor: interpolateColor(
          (colorCycle.value + index) % colors.length,
          colors.map((_, i) => i),
          colors
        ),
      };
    });

  return (
    <View className="items-center justify-center space-y-3">

      {/* Bouncing dots */}
      <View className="flex-row space-x-2 mt-1">
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              {
                width: 6,
                height: 6,
                borderRadius: 3,
              },
              getDotStyle(i),
            ]}
          />
        ))}
      </View>
    </View>
  );
};

export default ColoreActivityIndicator;

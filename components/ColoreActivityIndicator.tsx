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
  paddingType = 'none'
}: {
  text?: string;
  size?: number;
  strokeWidth?: number;
  colors?: string[];
  paddingType?: "none" | "fullPage"
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
    <View 
    className="items-center justify-center space-y-3"
    style={{
      marginTop: paddingType == "fullPage" ? -90 : 0
    }}>

      {/* Bouncing dots */}
      <View className="flex-row space-x-2 mt-1">
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              {
                width: 8,
                height: 8,
                borderRadius: 30,
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

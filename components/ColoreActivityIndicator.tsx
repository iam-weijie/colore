import React from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';
import { Easing } from 'react-native-reanimated';

const ColoreActivityIndicator = ({
  text = 'Loading...',
  size = 50,
  colors = ['#FAE640', '#FBB1D6', '#B79EFF', '#6CD9FF'],
}: {
  text?: string;
  size?: number;
  colors?: string[];
}) => {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);
  const colorCycle = useSharedValue(0);

  // Continuous animations
  rotation.value = withRepeat(
    withTiming(360, { duration: 1800, easing: Easing.linear }),
    -1
  );

  pulse.value = withRepeat(
    withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
    -1,
    true
  );

  colorCycle.value = withRepeat(
    withTiming(colors.length, { duration: 4000, easing: Easing.linear }),
    -1
  );

  const ringStyle = useAnimatedStyle(() => {
    const colorTop = interpolateColor(
      colorCycle.value % colors.length,
      colors.map((_, i) => i),
      colors
    );
    const colorRight = interpolateColor(
      (colorCycle.value + 1) % colors.length,
      colors.map((_, i) => i),
      colors
    );
    const colorBottom = interpolateColor(
      (colorCycle.value + 2) % colors.length,
      colors.map((_, i) => i),
      colors
    );

    const scale = interpolate(pulse.value, [0, 1], [1, 1.08]);

    return {
      transform: [{ rotate: `${rotation.value}deg` }, { scale }],
      borderTopColor: colorTop,
      borderRightColor: colorRight,
      borderBottomColor: colorBottom,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulse.value, [0, 1], [1, 1.03]);
    const color = interpolateColor(
      colorCycle.value % colors.length,
      colors.map((_, i) => i),
      colors
    );

    return {
      transform: [{ scale }],
      color,
    };
  });

  return (
    <View className="flex items-center justify-center space-y-3">
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderWidth: size / 10,
            borderRadius: size / 2,
            borderLeftColor: 'transparent',
            backgroundColor: 'rgba(255,255,255,0.08)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          ringStyle,
        ]}
      />

      <Animated.Text
        style={textStyle}
        className="text-sm text-center font-JakartaMedium"
      >
        {text}
      </Animated.Text>

      <View className="flex-row space-x-1">
        {[0, 1, 2].map((i) => {
          return (
            <Animated.View
              key={i}
              style={useAnimatedStyle(() => {
                const phase = (rotation.value + i * 120) * (Math.PI / 180);
                return {
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: interpolateColor(
                    (colorCycle.value + i) % colors.length,
                    colors.map((_, i) => i),
                    colors
                  ),
                  opacity: 0.6 + 0.3 * Math.sin(phase),
                  transform: [{ translateY: Math.sin(phase) * 3 }],
                };
              })}
            />
          );
        })}
      </View>
    </View>
  );
};

export default ColoreActivityIndicator;

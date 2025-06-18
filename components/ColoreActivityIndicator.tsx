import React, { useEffect } from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  useDerivedValue,
  Easing,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ColoreActivityIndicator = ({
  size = 60,
  dotSize = 5,
  colors = ["#ffe640", "#FBB1F5", "#93c5fd"],
  orbitRadius = 14,
}: {
  size?: number;
  dotSize?: number;
  colors?: string[];
  orbitRadius?: number;
}) => {
  const progress = useSharedValue(0); // Common time base

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1
    );
  }, []);

  const getDynamicAngle = (index: number) =>
    useDerivedValue(() => {
      const phaseOffset = index / 3;
      const t = (progress.value + phaseOffset) % 1;

      // Modulate spacing using sin wave
      const spacingWave = Math.sin(progress.value * 2 * Math.PI); // -1 to 1
      const dynamicOffset = (index * 0.25 + 0.05 * spacingWave * index) % 1; // vary angular gap

      const angle = 2 * Math.PI * ((progress.value + dynamicOffset) % 1);
      return angle;
    });

  const getDotProps = (angleValue: Animated.SharedValue<number>, color: string) =>
    useAnimatedProps(() => {
      return {
        fill: color,
        cx: size / 2 + orbitRadius * Math.cos(angleValue.value),
        cy: size / 2 + orbitRadius * Math.sin(angleValue.value),
        r: dotSize,
      };
    });

  return (
    <View className="items-center justify-center">
      <Svg width={size} height={size}>
        {colors.map((color, index) => (
          <AnimatedCircle
            key={index}
            animatedProps={getDotProps(getDynamicAngle(index), color)}
          />
        ))}
      </Svg>
    </View>
  );
};

export default ColoreActivityIndicator;

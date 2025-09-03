import React from "react";
import { View, Text } from "react-native";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";

type Props = {
  progressSV: Animated.SharedValue<number>;   // 0..1
  directionSV: Animated.SharedValue<number>;  // -1, 0, +1
};

const AnimatedText = Animated.createAnimatedComponent(Text);

const EmojiSwipeOverlay: React.FC<Props> = ({ progressSV, directionSV }) => {
  const style = useAnimatedStyle(() => {
    const scale = interpolate(progressSV.value, [0, 1], [0.2, 1]);
    const opacity = interpolate(progressSV.value, [0, 0.2, 1], [0, 0.6, 1]);
    const rotate = interpolate(directionSV.value, [-1, 0, 1], [-10, 0, 10]);
    return {
      transform: [{ scale }, { rotate: `${rotate}deg` }],
      opacity,
    };
  });

  const emojiStyle = useAnimatedStyle(() => {
    // choose emoji by direction
    // left (disagree) => 🤯 ; right (agree) => 👌 ; idle => nothing
    const dir = directionSV.value;
    return { };
  });

  // We have to pick emoji in render based on directionSV; use a simple threshold
  const [fallback, setFallback] = React.useState<string>("");

  // A tiny polling to avoid re-render every frame; we just reflect current direction
  React.useEffect(() => {
    const id = setInterval(() => {
      // reading value is okay here; overlay is visual aid
      const dir = (directionSV as any).value as number;
      setFallback(dir > 0.01 ? "👌" : dir < -0.01 ? "🤯" : "");
    }, 50);
    return () => clearInterval(id);
  }, [directionSV]);

  if (!fallback) return null;

  return (
    <View pointerEvents="none" style={{ position: "absolute", top: "46%", left: 0, right: 0, alignItems: "center" }}>
      <AnimatedText style={[{ fontSize: 72 }, style]}>{fallback}</AnimatedText>
    </View>
  );
};

export default EmojiSwipeOverlay;

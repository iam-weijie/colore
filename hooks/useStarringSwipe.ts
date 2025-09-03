import { useRef } from "react";
import { useWindowDimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

type Args = {
  index: number;
  total: number;
  setIndex: (n: number) => void;
  infiniteScroll?: boolean;
  onDecision?: (dir: 1 | -1) => void; // +1 = agree (right), -1 = disagree (left)
  onNearEnd?: () => void;
};

export function useStarringSwipe({
  index,
  total,
  setIndex,
  infiniteScroll = false,
  onDecision,
  onNearEnd,
}: Args) {
  const { width } = useWindowDimensions();

  // movement + overlay
  const translateX = useSharedValue(0);
  const progress = useSharedValue(0);        // 0..1, strength of swipe
  const direction = useSharedValue< -1 | 0 | 1 >(0); // -1 left, +1 right

  // lock to prevent double navigations
  const lockedRef = useRef(false);

  const reset = () => {
    translateX.value = withSpring(0, { damping: 22, stiffness: 300 });
    progress.value = withTiming(0, { duration: 140 });
    direction.value = withTiming(0, { duration: 140 });
  };

  const goNext = () => {
    const next = infiniteScroll ? (index + 1) % total : Math.min(index + 1, total - 1);
    if (next >= total - 1 && onNearEnd) runOnJS(onNearEnd)();
    runOnJS(setIndex)(next);
  };

  const commit = (dir: 1 | -1) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    if (onDecision) runOnJS(onDecision)(dir);

    translateX.value = withTiming(dir * width, { duration: 180 }, () => {
      runOnJS(goNext)();
      // prep next card immediately
      translateX.value = 0;
      progress.value = 0;
      direction.value = 0;
      lockedRef.current = false;
    });
  };

  const gesture = Gesture.Pan()
    .minDistance(12)
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      if (lockedRef.current) return;
      translateX.value = e.translationX;

      // overlay mapping
      direction.value = e.translationX === 0 ? 0 : e.translationX > 0 ? 1 : -1;
      const thresh = width * 0.45; // how far until max overlay
      const p = Math.min(Math.abs(e.translationX) / thresh, 1);
      progress.value = p;
    })
    .onEnd(() => {
      if (lockedRef.current) return;

      const shouldCommit = Math.abs(translateX.value) > width * 0.18;
      if (!shouldCommit) {
        reset();
        return;
      }
      commit(translateX.value > 0 ? 1 : -1);
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: 1 - progress.value * 0.06 },
    ],
    opacity: 1 - progress.value * 0.35,
  }));

  // Optional programmatic trigger (e.g., buttons)
  const triggerDecision = (dir: 1 | -1) => commit(dir);

  return {
    gesture,
    cardStyle,
    overlayProgress: progress,
    overlayDirection: direction,
    triggerDecision,
  };
}

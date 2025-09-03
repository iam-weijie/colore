import { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from "react-native-reanimated";
import { Gesture } from "react-native-gesture-handler";
import { useRef } from "react";

type UseSwipeArgs = {
  index: number;
  setIndex: (n: number) => void;
  total: number;
};

export function useSwipeNavigation({ index, setIndex, total }: UseSwipeArgs) {
  const translateX = useSharedValue(0);
  const isNavigatingRef = useRef(false);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      if (!isNavigatingRef.current) {
        translateX.value = e.translationX;
      }
    })
    .onEnd(() => {
      if (isNavigatingRef.current) {
        translateX.value = withSpring(0);
        return;
      }

      const threshold = 50;
      const isLast = index === total - 1;

      if (translateX.value > threshold && index > 0) {
        // Swipe right - go to previous
        isNavigatingRef.current = true;
        translateX.value = withTiming(300, { duration: 200 }, () => {
          runOnJS(setIndex)(index - 1);
          translateX.value = -300;
          translateX.value = withTiming(0, { duration: 200 }, () => {
            isNavigatingRef.current = false;
          });
        });
      } else if (translateX.value < -threshold && !isLast) {
        // Swipe left - go to next
        isNavigatingRef.current = true;
        translateX.value = withTiming(-300, { duration: 200 }, () => {
          runOnJS(setIndex)(index + 1);
          translateX.value = 300;
          translateX.value = withTiming(0, { duration: 200 }, () => {
            isNavigatingRef.current = false;
          });
        });
      } else {
        // Snap back
        translateX.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { 
    gesture, 
    cardStyle, 
    isNavigating: isNavigatingRef.current 
  };
}

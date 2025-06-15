import React, { useEffect } from "react";
import Animated, {
  BounceIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const CarrouselIndicator = ({ id, index, color = "white" }: { id: number; index: number, color: string }) => {
    // Shared values for animation
    const width = useSharedValue(id === index ? 50 : 8);
    const opacity = useSharedValue(id === index ? 1 : 0.5);
  
    // Animate when `id` or `index` changes
    useEffect(() => {
      if (id === index) {
        width.value = withTiming(50, { duration: 250 }); // Animate width to 50
        opacity.value = withTiming(1, { duration: 250 }); // Animate opacity to 1
      } else {
        width.value = withTiming(8, { duration: 250 }); // Animate width back to 8
        opacity.value = withTiming(0.5, { duration: 250 }); // Animate opacity back to 0.5
      }
    }, [id, index]);
  
    // Animated styles
    const animatedStyle = useAnimatedStyle(() => {
      return {
        width: width.value,
        opacity: opacity.value,
      };
    });
  
    return (
      <Animated.View
        style={[
          {
            borderRadius: 999, // Fully rounded corners
            padding: 2,
            minWidth: 8,
            height: 8,
            backgroundColor: color,
            marginHorizontal: 4,
          },
          animatedStyle, // Apply animated styles
        ]}
      />
    );
  };

  export default CarrouselIndicator;
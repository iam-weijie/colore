import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

type ProgressBarProps = {
  progress: number; // percentage (0-100)
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  borderRadius?: number;
  animationDuration?: number;
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 3,
  backgroundColor = '#E5E7EB',
  progressColor = '#FBB1F5',
  borderRadius = 999,
  animationDuration = 800,
}) => {
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Animate to new progress value
    progressWidth.value = withTiming(
      Math.min(Math.max(progress, 0), 100), // Clamp between 0-100
      {
        duration: animationDuration,
        easing: Easing.out(Easing.exp), // Smooth exponential easing
      }
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View 
      style={{ 
        height,
        borderRadius,
        backgroundColor,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <Animated.View
        style={[
          {
            backgroundColor: progressColor,
            height: '100%',
            borderRadius,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

export default ProgressBar;
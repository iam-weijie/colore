import React from 'react';
import { View, Text, Image } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withRepeat,
  useAnimatedStyle,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { characters } from '@/constants';

const ColoreActivityIndicator = ({
  text = 'Loading...',
}: {
  text?: string;
}) => {
  const rotation = useSharedValue(0);
  const imageBounce = useSharedValue(0);

  // Start all animations
  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1
    );

    // Subtle bounce animation for the image
    imageBounce.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1000, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 1000, easing: Easing.bounce })
      ),
      -1
    );
  }, []);

  // Dot animation - vertical bounce only
  const getDotStyle = (index: number) =>
    useAnimatedStyle(() => {
      const phase = (rotation.value + index * 90) * (Math.PI / 180);
      const translateY = Math.sin(phase) * 4;
      
      return {
        transform: [{ translateY }],
        opacity: 0.6 + 0.4 * Math.sin(phase),
      };
    });

  // Image animation style
  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: imageBounce.value }],
  }));

  return (
    <View className="items-center justify-center space-y-3">
      {/* Animated image with subtle bounce */}
      <Animated.View style={imageStyle}>
        <Image 
          source={characters.bobChill} 
          className="w-24 h-24 -mb-6" 
          resizeMode="contain" 
        />
      </Animated.View>

      <Text className="text-sm text-gray-700 font-JakartaMedium">{text}</Text>

      {/* Bouncing dots indicator - all black */}
      <View className="flex-row space-x-2 mt-1">
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              {
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#000000', // Black color
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
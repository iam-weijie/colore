import React from 'react';
import { TouchableOpacity, View, ViewStyle, Animated, Easing } from 'react-native';

interface CircleProps {
  color: string;
  size?: number;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

const Circle: React.FC<CircleProps> = ({
  color,
  size = 50,
  selected = false,
  onPress,
  style,
}) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const borderWidthValue = React.useRef(new Animated.Value(3)).current;

  React.useEffect(() => {
    // Selection animation - all non-native since borderWidth can't use native driver
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: selected ? 1.1 : 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false, // Changed to false
      }),
      Animated.timing(borderWidthValue, {
        toValue: selected ? 3 : 2,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }, [selected]);

  const animatedCircle = (
    <Animated.View
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        borderRadius: size / 2,
        margin: 5,
        borderWidth: borderWidthValue,
        borderColor: 'white',
        transform: [{ scale: scaleValue }],
        ...style,
      }}
    />
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {animatedCircle}
      </TouchableOpacity>
    );
  }

  return animatedCircle;
};

export default Circle;
import { PostItColor } from "@/types/type";
import React from "react";
import { View, Text, Animated, Easing } from "react-native";
import Circle from "./Circle";

interface ColorSelectorProps {
  colors: PostItColor[];
  selectedColor: PostItColor;
  onColorSelect: (color: PostItColor) => void;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({
  colors,
  selectedColor,
  onColorSelect,
}) => {
  // Animation values for each color
  const animationValues = colors.reduce((acc, color) => {
    acc[color.id] = React.useRef(new Animated.Value(0)).current;
    return acc;
  }, {} as Record<string, Animated.Value>);

  React.useEffect(() => {
    colors.forEach(color => {
      Animated.timing(animationValues[color.id], {
        toValue: selectedColor.id === color.id ? 1 : 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  }, [selectedColor]);

  return (
    <View className="flex-column items-end justify-start">
      {colors.map((color) => (
        <View key={color.id} className="flex flex-row items-center justify-center">
          <Animated.View
            style={{
              opacity: animationValues[color.id],
              transform: [{
                translateX: animationValues[color.id].interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                })
              }],
              marginRight: 8,
            }}
          >
            <Text className="text-[14px] font-JakartaBold text-white">
              Selected
              </Text>
          </Animated.View>
          <Circle
            color={color.hex}
            size={30}
            selected={selectedColor.id === color.id}
            onPress={() => {
              onColorSelect(color);
              // Optional: Add a small bounce effect on press
              Animated.sequence([
                Animated.timing(animationValues[color.id], {
                  toValue: 1.2,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.spring(animationValues[color.id], {
                  toValue: 1,
                  friction: 3,
                  useNativeDriver: true,
                })
              ]).start();
            }}
          />
        </View>
      ))}
    </View>
  );
};

export default ColorSelector;
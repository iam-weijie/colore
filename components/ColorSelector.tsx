import { PostItColor } from "@/types/type";
import React from "react";
import { View, Text } from "react-native";
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
  return (
    <View className="flex-column items-end justify-start ">
      {colors.map((color) => (
        <View className="flex flex-row items-center justify-center">
          {selectedColor.id === color.id && <Text className="text-[14px] font-JakartaBold text-white">Selected</Text>}
        <Circle
          key={color.id}
          color={color.hex}
          size={30}
          selected={selectedColor.id === color.id}
          onPress={() => onColorSelect(color)}
        />
        </View>
      ))}
    </View>
  );
};

export default ColorSelector;

import React from 'react';
import { View } from 'react-native';
import Circle from './Circle';
import { PostItColor } from '@/types/type';

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
  const handleColorSelect = (color: PostItColor) => {
    console.log('Color selected:', color); // Debug log
    onColorSelect(color);
  };

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 12 }}>
      {colors.map((color) => (
        <Circle
          key={color.id}
          color={color.hex}
          size={30}
          selected={selectedColor.id === color.id}
          onPress={() => handleColorSelect(color)}
        />
      ))}
    </View>
  );
};

export default ColorSelector;
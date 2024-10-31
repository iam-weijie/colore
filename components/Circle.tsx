import { View, ViewStyle } from "react-native";
import { TouchableOpacity } from "react-native";

interface CircleProps {
  color: string;
  size?: number;
  style?: ViewStyle;
}

const Circle: React.FC<CircleProps> = ({ color, size = 50, style }) => {
  return (
  selected?: boolean;
  onPress?: () => void;
}

const Circle: React.FC<CircleProps> = ({ color, size = 50, selected = false, onPress }) => {
  const circle = (
    <View
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        borderRadius: size / 2,
        margin: 5,
        ...style,
        // Only adding the border style - minimal change needed
        borderWidth: selected ? 2 : 0,
        borderColor: 'black',
      }}
    />
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress}>
        {circle}
      </TouchableOpacity>
    );
  }

  return circle;
};

export default Circle;
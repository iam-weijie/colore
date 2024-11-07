import { TouchableOpacity, View, ViewStyle } from "react-native";

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
  const circle = (
    <View
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        borderRadius: size / 2,
        margin: 5,
        // Only adding the border style - minimal change needed
        borderWidth: selected ? 2 : 0,
        borderColor: "black",
        ...style,
      }}
    />
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{circle}</TouchableOpacity>;
  }

  return circle;
};

export default Circle;

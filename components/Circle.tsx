import { View, ViewStyle } from "react-native";

interface CircleProps {
  color: string;
  size?: number;
  style?: ViewStyle;
}

const Circle: React.FC<CircleProps> = ({ color, size = 50, style }) => {
  return (
    <View
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        borderRadius: size / 2,
        margin: 5,
        ...style,
      }}
    />
  );
};

export default Circle;
import { View } from "react-native";

interface CircleProps {
  color: string;
  size?: number;
}

const Circle: React.FC<CircleProps> = ({ color, size = 50 }) => {
  return (
    <View
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        borderRadius: size / 2,
        margin: 5,
      }}
    />
  );
};

export default Circle;

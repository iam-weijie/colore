import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { temporaryColors } from "@/constants";
import { PostItColor } from "@/types/type";

interface PostItProps {
  color?: string;
}

const PostIt: React.FC<PostItProps> = ({ color }) => {

  const getColorHex = (colorName: string | undefined) => {
    const foundColor = temporaryColors.find(c => c.name === colorName);
    return foundColor?.hex || "#ffe640"; // Default colour it yellow
  };



// Function to lighen the colour for corner of post-it
const lightenColor = (hex: string): string => {
  // Convert hex to RGB
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  // Lighten
  r = Math.min(255, r + Math.round(255 * 0.15));
  g = Math.min(255, g + Math.round(255 * 0.15));
  b = Math.min(255, b + Math.round(255 * 0.15));

  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const baseColor = getColorHex(color);
const foldColor = lightenColor(baseColor);
  
  return (
    <View className="w-40 h-40 shadow">
      {/* Post-it Shape */}
      <Svg height="160" width="160">
        <Path
          d="M16,0 
             A16,16 0 0,0 0,16
             L0,144
             A16,16 0 0,0 16,160
             L144,160
             A16,16 0 0,0 160,144
             L160,36
             L124,0
             Z"
          fill={baseColor}
        />
      </Svg>

      {/* Folded Corner */}
      <View
        className="absolute right-0 top-0"
        style={{
          width: 0,
          height: 0,
          borderTopWidth: 36,
          borderLeftWidth: 36,
          borderRightWidth: 0,
          borderStyle: "solid",
          borderTopColor: "transparent",
          borderLeftColor: foldColor,
          borderRightColor: "transparent",
        }}
      />
    </View>
  );
};

export default PostIt;

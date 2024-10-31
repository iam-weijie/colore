import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { temporaryColors } from "@/constants";
import { PostItColor } from "@/types/type";

interface PostItProps {
  color?: string;
}

const PostIt: React.FC<PostItProps> = ({ color }) => {


  // Used instead of color.hex incase colour is undefined or NULL in database and Post object
  // Should be changed later to color.hex when color is changed from a string to a PostItColor
  const getColorHex = (colorName: string | undefined) => {
    const foundColor = temporaryColors.find(c => c.name === colorName);
    return foundColor?.hex || "#ffe640"; // Default colour it yellow
  };

  const getFoldColorHex = (colorName: string | undefined) => {
    const foundColor = temporaryColors.find(c => c.name === colorName);
    return foundColor?.foldcolorhex || "#fef08a"; // Default colour it yellow 
  };

  const baseColor = getColorHex(color);
  const foldColor = getFoldColorHex(color);
  
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

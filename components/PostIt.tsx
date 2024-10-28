import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

const PostIt = () => {
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
          fill="#fde047" // Tailwind yellow-300
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
          borderLeftColor: "#fef08a", // Tailwind yellow-200
          borderRightColor: "transparent",
        }}
      />
    </View>
  );
};

export default PostIt;

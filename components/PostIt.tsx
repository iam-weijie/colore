import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  FadeInUp,
  FadeInDown,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import {
  View,
} from "react-native";
import React from "react";
import { useAllPostItColors } from "@/hooks/useTheme";

interface PostItProps {
  color?: string;
  viewed?: boolean;
}


const PostIt: React.FC<PostItProps> = ({ color, viewed=false }) => {
  const allColors = useAllPostItColors()
  // Used instead of color.hex incase colour is undefined or NULL in database and Post object
  // Should be changed later to color.hex when color is changed from a string to a PostItColor
  const getColorHex = (colorName: string | undefined) => {
    const foundColor = allColors.find((c) => c.id === colorName);
    return foundColor?.hex || "#ffe640"; // Default colour it yellow
  };

  const getFoldColorHex = (colorName: string | undefined) => {
    const foundColor = allColors.find((c) => c.id === colorName);
    return foundColor?.foldcolorhex || "#fef08a"; // Default colour it yellow
  };

  const baseColor = getColorHex(color);
  const foldColor = getFoldColorHex(color);

  return (
    viewed ? (
    <Animated.View 
    entering={FadeInDown.duration(100)}
    className="w-40 h-40 ">
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
      <Animated.View
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
          borderBottomLeftRadius: 8
        }}
      />
    </Animated.View>) : (
      <Animated.View
       entering={FadeInDown.duration(100)}
        className="w-40 h-40 rounded-[16px]"
        style={{
        backgroundColor: baseColor
        }}
      >
      </Animated.View>
    )
  );
};

export default PostIt;

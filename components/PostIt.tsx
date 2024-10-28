import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

const PostIt = () => {
  return (
    <View>
      {/* Bottom Half with Shadow */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        width: 160,
        height: 128,
        backgroundColor: '#fde047', // yellow-300
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
      }} />

      {/* Main Square with All Rounded Corners */}
      <Svg height="160" width="160">
        <Path
          d="M16,0 
             A16,16 0 0,0 0,16
             L0,144
             A16,16 0 0,1 16,160
             L144,160
             A16,16 0 0,1 160,144
             L160,36
             L124,0
             A16,16 0 0,0 16,0
             Z"
          fill="#fde047" // yellow-300
        />
      </Svg>

      {/* Folded Corner Shadow */}
      <View style={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: 0,
        height: 0,
        borderTopWidth: 36,
        borderLeftWidth: 36,
        borderRightWidth: 0,
        borderStyle: 'solid',
        borderTopColor: 'transparent',
        borderLeftColor: '#fef08a', // yellow-200
        borderRightColor: 'transparent',
      }} />
    </View>
  );
};

export default PostIt;

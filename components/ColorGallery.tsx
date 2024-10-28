import {
  Text,
  View,
  Dimensions,
} from "react-native";
import Circle from "@/components/Circle";
import { temporaryColors } from "@/constants/index";
import { PostItColor } from "@/types/type";

const ColorGallery = () => {
    const screenWidth = Dimensions.get("window").width;

    return (
        <View style = {{ width: screenWidth * 0.85 }}>
            <Text className="text-lg font-JakartaSemiBold">Colors</Text>
            <View className="flex-row">
                {temporaryColors.slice(0,5).map((item: PostItColor) => (
                    <Circle key={item.id} color={item.hex} size={50}/>
                ))}

            </View>
        </View>
    )
}

export default ColorGallery;
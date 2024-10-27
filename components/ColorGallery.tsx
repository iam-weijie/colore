import {
  FlatList,
  Text,
  View,
  Dimensions,
} from "react-native";
import Circle from "@/components/Circle";
import { temporaryColors } from "@/constants/index";
import { PostItColor } from "@/types/type";

const ColorGallery = () => {
    const screenWidth = Dimensions.get("window").width;

    const renderItem = ({ item }: { item: PostItColor }) => (
        <Circle color={item.hex} size={50} />
      );
    
    return (
        <View style = {{ width: screenWidth * 0.85 }}>
            <Text className="text-lg font-JakartaSemiBold">Colors</Text>
            <FlatList
                data={temporaryColors}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                numColumns={4}
                showsVerticalScrollIndicator={false}
            />
        </View>
    )
}

export default ColorGallery;
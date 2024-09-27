import { View } from "react-native";

const PostIt = () => {
  return (
    <View className="absolute left-10 top-36">
      {/* Bottom Half with Shadow */}
      <View className="bg-yellow-300 rounded-b-2xl w-40 h-32 absolute bottom-0 shadow-lg" />

      {/* Top Half without Shadow */}
      <View className="bg-yellow-300 rounded-2xl w-40 h-40" />

      {/* Folded Corner */}
      <View className="absolute right-0 top-0 w-0 h-0 border-t-[36px] border-l-[36px] rounded-bl-md border-t-[#f2f2f2] border-l-yellow-200 border-r-transparent" />
    </View>
  );
};

export default PostIt;

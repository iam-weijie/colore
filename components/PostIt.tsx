import { View } from "react-native";

const PostIt = () => {
  return (
    <View className="bg-yellow-300 rounded-2xl w-40 h-40 shadow-lg absolute left-20 top-36">
      {/* Folded Corner */}
      <View className="absolute right-0 top-0 w-0 h-0 border-t-[32px] border-l-[32px] rounded-bl-md border-t-general-300 border-l-yellow-200 border-r-transparent" />
    </View>
  );
};

export default PostIt;

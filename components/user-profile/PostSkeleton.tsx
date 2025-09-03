// PostSkeleton.tsx
import React from "react";
import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

const PostSkeleton = React.memo(() => (
  <Animated.View entering={FadeIn.duration(600)} className="w-full px-4 my-3">
    <View className="bg-gray-200 rounded-2xl w-full h-32 opacity-70" />
  </Animated.View>
));

export default PostSkeleton;

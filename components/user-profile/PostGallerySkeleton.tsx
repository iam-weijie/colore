// PostGallerySkeleton.tsx
import React from "react";
import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import PostSkeleton from "./PostSkeleton";

const PostGallerySkeleton = React.memo(() => (
  <Animated.View entering={FadeIn.duration(400)} className="w-full">
    <View className="w-full mx-8 flex flex-row items-center justify-between mb-4">
      <View className="w-32 h-6 bg-gray-200 rounded opacity-70" />
      <View className="w-16 h-4 bg-gray-200 rounded opacity-70" />
    </View>
    <PostSkeleton />
    <PostSkeleton />
    <PostSkeleton />
  </Animated.View>
));

export default PostGallerySkeleton;

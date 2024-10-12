import PostModal from "@/components/PostModal";
import { Post, UserPostsGalleryProps } from "@/types/type";
import React, { useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

const UserPostsGallery: React.FC<UserPostsGalleryProps> = ({ posts }) => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return `${text.slice(0, maxLength)}...`;
    }
    return text;
  };

  if (!posts) {
    return <Text>AN error occurred.</Text>;
  }

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity onPress={() => setSelectedPost(item)}>
      <View className="flex-1 m-2 p-2 border border-gray-300 rounded-lg bg-transparent w-[88%] mx-auto">
        <Text className="font-JakartaSemiBold">
          {truncateText(item.content, 100)}
        </Text>
        <View className="flex-row justify-end">
          <Text className="text-gray-500">Likes: {item.like_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  return (
    <View className="flex-1 p-4  max-h-[80%]">
      <FlatList
        className="flex-1"
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={1}
        showsVerticalScrollIndicator={true}
      />
      {selectedPost && (
        <PostModal
          isVisible={!!selectedPost}
          post={selectedPost}
          handleCloseModal={handleCloseModal}
        />
      )}
    </View>
  );
};

export default UserPostsGallery;

import PostModal from "@/components/PostModal";
import { Post, UserPostsGalleryProps } from "@/types/type";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const UserPostsGallery: React.FC<UserPostsGalleryProps> = ({
  posts,
  handleUpdate,
}) => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const screenWidth = Dimensions.get("window").width;

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
      <View
        className="flex-1 m-2 p-2 border border-gray-300 rounded-lg bg-transparent mx-auto"
        style={{ width: screenWidth * 0.85 }}
      >
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
    <View className="absolute max-h-[85%]">
      <Text className="text-lg font-JakartaSemiBold">Posts</Text>
      <FlatList
        className="flex-1"
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={1}
        showsVerticalScrollIndicator={false}
      />
      {selectedPost && (
        <PostModal
          isVisible={!!selectedPost}
          post={selectedPost}
          handleCloseModal={handleCloseModal}
          handleUpdate={handleUpdate}
        />
      )}
    </View>
  );
};

export default UserPostsGallery;

import { fetchAPI } from "@/lib/fetch";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReactNativeModal from "react-native-modal";

interface Post {
  id: number;
  user_id: string;
  firstname: string;
  content: string;
  created_at: string;
  likes_count: number;
  report_count: number;
}

interface UserPostsGalleryProps {
  posts: Post[];
}

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
      <View className="flex-1 m-2 p-2 border border-gray-300 rounded-lg bg-transparent">
        <Text className="font-JakartaSemiBold">
          {truncateText(item.content, 100)}
        </Text>
        <View className="flex-row justify-between">
          <Text className="text-gray-500">Likes: {item.likes_count}</Text>
          <Text className="text-gray-500">Reports: {item.report_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  return (
    <View className="flex-1 p-4">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={1}
        showsVerticalScrollIndicator={false}
      />
      {selectedPost && (
        <ReactNativeModal isVisible={!!selectedPost}>
          <View className="bg-white px-8 py-10 rounded-2xl min-h-[400px] max-w-[90%] mx-auto"> 
            <Button title="Close" className="m-2" onPress={handleCloseModal} />
            <View>
              <Text className="text-lg font-bold mb-2">{selectedPost.content}</Text> 
              <View>
                <Text className="text-sm">Likes: {selectedPost.likes_count}</Text>
                <Text className="text-sm">Reports: {selectedPost.report_count}</Text>
              </View>
            </View>
          </View>
      </ReactNativeModal>
      
      )}
    </View>
  );
};

export default UserPostsGallery;

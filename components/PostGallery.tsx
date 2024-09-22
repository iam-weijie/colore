import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Button,
} from "react-native";
import ReactNativeModal from "react-native-modal";
import { fetchAPI } from "@/lib/fetch";

interface Post {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  report_count: number;
}

interface UserPostsGalleryProps {
  userId: string;
}

const UserPostsGallery: React.FC<UserPostsGalleryProps> = ({ userId }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return `${text.slice(0, maxLength)}...`;
    }
    return text;
  };

  useEffect(() => {
    const fetchUserPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchAPI(
          `/(api)/(posts)/getuserposts?id=${userId}`,
          {
            method: "GET",
          }
        );
        if (response.error) {
          throw new Error(response.error);
        }
        setPosts(response.data);
      } catch (error) {
        setError("Failed to fetch posts.");
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserPosts();
  }, [userId]);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text>{error}</Text>;
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
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <View>
              <Text>{selectedPost.content}</Text>
              <View>
                <Text>Likes: {selectedPost.likes_count}</Text>
                <Text>Reports: {selectedPost.report_count}</Text>
              </View>
              <Button title="Close" onPress={handleCloseModal} />
            </View>
          </View>
        </ReactNativeModal>
      )}
    </View>
  );
};

export default UserPostsGallery;

import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
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
    <View>
      <Text>{item.content}</Text>
      <Text>Likes: {item.likes_count}</Text>
      <Text>Reports: {item.report_count}</Text>
    </View>
  );

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      numColumns={2}
      showsVerticalScrollIndicator={false}
    />
  );
};
export default UserPostsGallery;

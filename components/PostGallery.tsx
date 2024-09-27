import React from "react";
import {
  FlatList,
  View,
} from "react-native";
import PostIt from "@/components/PostIt";

interface Post {
  id: number;
  content: string;
  firstname: string;
  created_at: string;
  likes_count: number;
  report_count: number;
}

interface UserPostsGalleryProps {
  userId: string;
  posts: Post[];
}

const PostGallery: React.FC<UserPostsGalleryProps> = ({ posts }) => {
  const renderItem = ({ item }: { item: Post }) => (
    <PostIt 
      content={item.content} 
      firstname={item.firstname}
      created_at={item.created_at}
      likes_count={item.likes_count} 
      report_count={item.report_count} 
    />
  );

  return (
    <View className="flex-1 p-4">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          justifyContent: 'center', 
        }}
      />
    </View>
  );
};

export default PostGallery;
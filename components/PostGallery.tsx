import React, { useState } from "react";
import {
  Button,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
} from "react-native";
import ReactNativeModal from "react-native-modal";
import { icons } from "@/constants/index";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
  const [likedPost, setLikedPost] = useState<boolean>(false);

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
        <View className="flex-row justify-end">
          <Text className="text-gray-500">Likes: {item.likes_count}</Text>
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
          <View className="bg-white px-6 py-4 rounded-2xl min-h-[150px] max-h-[70%] max-w-[90%] mx-auto"> 
            <TouchableOpacity onPress={handleCloseModal}>
              <Image className="w-6 h-6" source={icons.close} style={{alignSelf: "flex-end"}}/>
            </TouchableOpacity>
            <ScrollView>
              <Text className="text-[16px] mb-2 font-Jakarta">{selectedPost.content}</Text> 
            </ScrollView>
            <View className="my-2">
              <TouchableOpacity onPress={() => setLikedPost(!likedPost)}>
                <MaterialCommunityIcons
                  name={likedPost ? "heart" : "heart-outline"}
                  size={32}
                  color={likedPost ? "red" : "black"}
                />
              </TouchableOpacity>
            </View>
          </View>
      </ReactNativeModal>
      
      )}
    </View>
  );
};

export default UserPostsGallery;

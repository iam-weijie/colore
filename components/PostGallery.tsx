import PostModal from "@/components/PostModal";
import { Post, UserPostsGalleryProps } from "@/types/type";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";
import {
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatDateTruncatedMonth } from "@/lib/utils";

const UserPostsGallery: React.FC<UserPostsGalleryProps> = ({
  posts,
  profileUserId,
  handleUpdate,
}) => {
  const { user } = useUser();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sortedPosts, setSortedPosts] = useState<Post[]>([]);

  // comparator function
  const sortByUnread = (a: Post, b: Post) => {
    if ((a.unread_comments > 0 && b.unread_comments === 0)) {
      return -1; // a comes first if has comments
    } else if (a.unread_comments === 0 && b.unread_comments > 0) {
      return 1; // b comes first if has comments
    } else { // otherwise equal
      return 0;
    }
  }

  // order posts (in-place) upon mounting so that posts with unread comments 
  // are pushed to the top, regardless of date posted
  // force an update if the user selects a post
  useEffect(() => {
    if (user!.id === profileUserId) {
      const sorted = [...posts].sort(sortByUnread);
      setSortedPosts(sorted);
    } else {
      setSortedPosts(posts);
    }
  }, [posts]);

  const screenWidth = Dimensions.get("window").width;

  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return `${text.slice(0, maxLength)}...`;
    }
    return text;
  };

  if (!posts) {
    return <Text>An error occurred.</Text>;
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
        <View className="flex-row justify-between">
          <Text className="font-Jakarta text-gray-500">{formatDateTruncatedMonth(new Date(item.created_at))}</Text>
          <Text className="font-Jakarta text-gray-500">Likes: {item.like_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  return (
    <View className="absolute max-h-[100%]">
      <Text className="text-lg font-JakartaSemiBold">Posts</Text>
      <FlatList
        className="flex-1"
        data={sortedPosts}
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

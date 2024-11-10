import PostModal from "@/components/PostModal";
import { Post, UserPostsGalleryProps } from "@/types/type";
import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-expo";
import {
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatDateTruncatedMonth } from "@/lib/utils";
import { useFocusEffect } from "expo-router";

const UserPostsGallery: React.FC<UserPostsGalleryProps> = ({
  posts,
  profileUserId,
  handleUpdate,
}) => {
  const { user } = useUser();
  const isOwnProfile = user!.id === profileUserId;
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sortedPosts, setSortedPosts] = useState<Post[]>([]);
  const [isReadingUnread, setIsReadingUnread] = useState(false);
  const [hasNavigatedAway, setHasNavigatedAway] = useState(false);

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
    if (isOwnProfile) {
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
    <TouchableOpacity onPress={() => {
        setSelectedPost(item);
        if (isOwnProfile && item.unread_comments > 0) {
          setIsReadingUnread(true);
          console.log("set isReadingUnread to truee");
        }
        setHasNavigatedAway(false);
      }}>
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
        {isOwnProfile && item.unread_comments > 0 && 
          <Text className="text-xs font-Jakarta text-red-500">
              New comments: {item.unread_comments}
          </Text>}
      </View>
    </TouchableOpacity>
  );

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  useFocusEffect(
    useCallback(() => {
      if (isReadingUnread && hasNavigatedAway && isOwnProfile && handleUpdate) {
        handleUpdate();
      };
    }, [hasNavigatedAway, isReadingUnread, handleUpdate])
  );

  // when user navigates away, set a "trigger"
  // to perform actions upon return
  useFocusEffect(
    useCallback(() => {
      return () => setHasNavigatedAway(true);
    }, [])
  );

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

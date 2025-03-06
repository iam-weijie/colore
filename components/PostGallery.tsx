import PostModal from "@/components/PostModal";
import { temporaryColors } from "@/constants";
import { formatDateTruncatedMonth } from "@/lib/utils";
import { Post, UserPostsGalleryProps } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { Link, useFocusEffect } from "expo-router";
import Animated, { SlideInDown, SlideInUp, FadeInDown } from "react-native-reanimated";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigationContext } from "./NavigationContext";

const UserPostsGallery: React.FC<UserPostsGalleryProps> = ({
  posts,
  profileUserId,
  handleUpdate,
  query,
  header
}) => {
  const { user } = useUser();
  const isOwnProfile = user!.id === profileUserId;
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sortedPosts, setSortedPosts] = useState<Post[]>([]);
  const [queueRefresh, setQueueRefresh] = useState(false);
  const [hasNavigatedAway, setHasNavigatedAway] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const { stateVars, setStateVars } = useNavigationContext();

  const sortByUnread = (a: Post, b: Post) => {
    if (a.unread_comments > 0 && b.unread_comments === 0) {
      return -1;
    } else if (a.unread_comments === 0 && b.unread_comments > 0) {
      return 1;
    } else {
      return 0;
    }
  };

  const filteredPosts = posts.filter((post) => post.content.toLowerCase().includes(query.toLowerCase()));

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
    <Animated.View entering={FadeInDown.duration(300)}>
    <TouchableOpacity
      onPress={() => {
        setSelectedPost(item);
      }}
    >
      <View
        className="flex-1 m-2 p-5  shadow-xs rounded-[24px] mx-auto"
        style={{ width: screenWidth * 0.85, backgroundColor: temporaryColors?.find((c) => c.name === item.color)?.hex || item.color}}
      >
        <Text className="font-JakartaSemiBold text-black">
         {truncateText(item.content, 100)}
        </Text>
        <View className="flex-row justify-between">
          <Text className="font-Jakarta text-gray-500">
            {item.created_at ? formatDateTruncatedMonth(new Date(item.created_at)) : ""}
          </Text>
        </View>
        {isOwnProfile && item.unread_comments > 0 && (
          <Text className="text-xs font-Jakarta text-red-500">
            New comments
          </Text>
        )}
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
 const handleUnsave = () =>{
  setIsSaved((prevPost) => !isSaved);
  handleUpdate(selectedPost?.id || -1, isSaved);
  handleCloseModal()

 }
  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  useFocusEffect(
    useCallback(() => {
      if (stateVars.queueRefresh && stateVars.hasNavigatedAway && isOwnProfile && handleUpdate) {
        handleUpdate(selectedPost?.id || -1, isSaved);
        setStateVars({ ...stateVars, queueRefresh: false }); // Reset queueRefresh to prevent infinite loop
      }
    }, [stateVars.hasNavigatedAway, stateVars.queueRefresh, handleUpdate, isOwnProfile, selectedPost, isSaved])
  );


  return (
    <View className=" max-h-[100%]">
      {filteredPosts.length > 0 ? 
      (
        header
        
      ) : 
      (<Text className="font-Jakarta text-gray-500">
              No Post Found
            </Text>)}
       
      {posts.length === 0 ? (
        <View
          className="flex-1 m-2 p-2 border border-gray-300 rounded-lg bg-transparent mx-auto"
          style={{ width: screenWidth * 0.85 }}
        >
          <Link href="/root/new-post">
            <Text className="font-Jakarta text-gray-500">
              Create a post to see it here
            </Text>
          </Link>
        </View>
      ) : (
        <FlatList
          className="mt-4 mx-7 rounded-[24px]"
          data={filteredPosts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={1}
          showsVerticalScrollIndicator={false}
        />
      )}
      {selectedPost && (
        <PostModal
          isVisible={!!selectedPost}
          selectedPost={selectedPost}
          handleCloseModal={handleCloseModal}
          handleUpdate={handleUnsave}
        />
      )}
    </View>
  );
};

export default UserPostsGallery;
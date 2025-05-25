import PostModal from "@/components/PostModal";
import { useGlobalContext } from "@/app/globalcontext";
import { temporaryColors } from "@/constants";
import { formatDateTruncatedMonth, getRelativeTime } from "@/lib/utils";
import { Post, UserPostsGalleryProps } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { Link, useFocusEffect } from "expo-router";
import Animated, { SlideInDown, SlideInUp, FadeInDown, FadeIn } from "react-native-reanimated";
import { router } from "expo-router";
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
  disableModal = false,
  query = "",
  header
}) => {
  const { user } = useUser();
  const { isIpad } = useGlobalContext(); 
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

  const filteredPosts = sortedPosts.filter((post) => post.content.toLowerCase().includes(query.toLowerCase()));

 
  useEffect(() => {
  
      const sorted = [...posts].sort(sortByUnread);
      setSortedPosts(sorted);

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

const renderItem = ({ item }: { item: Post }) => {
  const backgroundColor = temporaryColors?.find((c) => c.name === item.color)?.hex || item.color;
  const isOwner = item.clerk_id === user?.id;
  const hasNewComments = isOwner && item.unread_comments > 0;
  
  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={{
        marginHorizontal: isIpad ? 6 : 0,
        maxWidth: 320,
        transform: [{ rotate: `${(Math.random() * 1.5 - 0.75).toFixed(2)}deg` }], // Reduced rotation range
      }}
    >
      <TouchableOpacity 
        onPress={() => 
          {
            setSelectedPost(item)
            disableModal && handleUpdate && handleUpdate(item.id);}}
        activeOpacity={0.9}
      >
        <View
          className="w-full mb-3 p-4 mx-auto"
          style={{
            borderRadius: 32,
            backgroundColor,
            borderColor: "#ffffff90",
            borderWidth: 2, 
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 }, 
            shadowOpacity: 0.08,
            shadowRadius: 4,
          }}
        >
          <Text 
            className="font-JakartaSemiBold text-black/90 text-[15px] leading-snug" 
            numberOfLines={3}
          >
            {truncateText(item.content, 120)} 
          </Text>

          <View className="flex-row justify-between items-center mt-2.5">
            <Text className="font-Jakarta text-xs text-gray-600/90">
              {item.created_at ? getRelativeTime(new Date(item.created_at)) : ""}
            </Text>

            {hasNewComments && (
              <View className="px-2 py-1 bg-red-500/95 rounded-full">
                <Text className="text-xs font-JakartaSemiBold text-white">
                  {item.unread_comments} comment{item.unread_comments > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

 const handleUnsave = () => {
  setIsSaved((prevPost) => !isSaved);
  if (handleUpdate) {
    handleUpdate(selectedPost?.id || -1, isSaved);
  }
  handleCloseModal();
 }
  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  useFocusEffect(
    useCallback(() => {
      if (stateVars.queueRefresh && isOwnProfile && handleUpdate) {
        console.log("Queueing refresh");
        handleUpdate(selectedPost?.id || -1, isSaved);
        setStateVars({ ...stateVars, queueRefresh: false });
      }
    }, [stateVars.queueRefresh, handleUpdate, isOwnProfile, selectedPost, isSaved])
  );


  return (
    <View className=" rounded-[24px] max-h-[100%]">
      {filteredPosts.length > 0 ? 
      (
        header
        
      ) : 
      (
      <TouchableOpacity activeOpacity={0.7} onPress={() => {router.push("/root/new-post")}}>
        <Animated.View 
          entering={FadeIn.duration(800)}
          className="w-full flex items-center justify-center p-6"
        >
          <Text className="font-Jakarta text-gray-500 text-center">
            Click to make a post and see it here!
          </Text>
        </Animated.View>
      </TouchableOpacity>)}
       
      {posts.length > 0 && (
        <FlatList
          className="mt-4 rounded-[24px]"
          data={filteredPosts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={isIpad ? 3 : 1}
          showsVerticalScrollIndicator={false}
        />
      )}
      {selectedPost && !disableModal && (
        <PostModal
          isVisible={!!selectedPost}
          selectedPosts={[selectedPost]}
          handleCloseModal={handleCloseModal}
          handleUpdate={handleUnsave}
        />
      )}
    </View>
  );
};

export default UserPostsGallery;
import PostModal from "@/components/PostModal";
import { useGlobalContext } from "@/app/globalcontext";
import { allColors } from "@/constants/colors";
import { formatDateTruncatedMonth, getRelativeTime } from "@/lib/utils";
import { Post, UserPostsGalleryProps } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { Link, useFocusEffect } from "expo-router";
import Animated, {
  SlideInDown,
  SlideInUp,
  FadeInDown,
  FadeIn,
} from "react-native-reanimated";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useHaptics } from "@/hooks/useHaptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigationContext } from "./NavigationContext";
import { decryptText, encryptText } from "@/lib/encryption";
import EmptyListView from "./EmptyList";
import ColoreActivityIndicator from "./ColoreActivityIndicator";

const UserPostsGallery: React.FC<UserPostsGalleryProps> = ({
  posts,
  profileUserId,
  handleUpdate,
  disableModal = false,
  query = "",
  header,
  offsetY,
  onLoadMore,
  isLoading,
  hasMore
}) => {
  const { user } = useUser();
  const { isIpad, encryptionKey } = useGlobalContext();
  const isOwnProfile = user!.id === profileUserId;
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sortedPosts, setSortedPosts] = useState<Post[]>([]);
  const { triggerHaptic } = useHaptics();
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

  const filteredPosts = sortedPosts.filter((post) =>
    post.content.toLowerCase().includes(query.toLowerCase())
  );

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

  const handleEndReached = () => {
    if (!isLoading && hasMore && onLoadMore) {
      console.log("Reached end, loading more posts");
      onLoadMore();
    }
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View className="py-5 flex items-center justify-center">
        <ColoreActivityIndicator />
      </View>
    );
  };

  const renderItem = ({ item }: { item: Post }) => {
    const backgroundColor =
      allColors?.find((c) => c.id === item.color)?.hex || item.color;
    const isOwner = item.user_id === user?.id;
    const hasNewComments = isOwner && item.unread_comments > 0;

    const isEncrypted = encryptionKey && item.recipient_user_id 
    const cleanContent = isEncrypted ? decryptText(item.content, encryptionKey) : item.content

    return (
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{
          marginHorizontal: isIpad ? 6 : 0,
          transform: [
            { rotate: `${(Math.random() * 1.5 - 0.75).toFixed(2)}deg` },
          ], // Reduced rotation range
        }}
      >
        <TouchableOpacity
          onPress={() => {
            setSelectedPost(item);
            disableModal && handleUpdate && handleUpdate(item.id);
          }}
          activeOpacity={0.9}
        >
          <View
            className="w-full mb-3 py-4 px-6 mx-auto"
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
              className="font-JakartaSemiBold text-white/90 text-[15px] shadow leading-snug"
              numberOfLines={3}
            >
              {truncateText(cleanContent, 120)}
            </Text>
            {item.prompt && <Text
              className="italic text-white/80 text-[13px] shadow leading-snug"
              numberOfLines={2}
            >
              {truncateText(item.prompt, 80)}
            </Text>}

            <View className="flex-row justify-between items-center mt-2.5">
              <Text className="font-Jakarta text-xs text-white/80">
                {item.created_at
                  ? getRelativeTime(new Date(item.created_at))
                  : ""}
              </Text>

              {hasNewComments && (
                <View className="px-3 py-2 bg-red-500/95 rounded-full">
                  <Text className="text-xs font-JakartaSemiBold text-white">
                    {item.unread_comments} comment
                    {item.unread_comments > 1 ? "s" : ""}
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
  };
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
    }, [
      stateVars.queueRefresh,
      handleUpdate,
      isOwnProfile,
      selectedPost,
      isSaved,
    ])
  );

  return (
    <View className="flex-1  w-full rounded-[24px] max-h-[100%]">
      {filteredPosts.length > 0 ? (
        header
      ) : (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            router.push("/root/new-post");
          }}
        >
          <Animated.View
            entering={FadeIn.duration(800)}
            className="w-full flex items-center justify-center p-6"
          >
            <Text className="font-Jakarta text-gray-500 text-center">
              Click to make a post and see it here!
            </Text>
          </Animated.View>
        </TouchableOpacity>
      )}

      {posts.length > 0 && (
        <FlatList
          className="flex-1 mt-4 h-full rounded-[24px]"
          data={filteredPosts}
          contentContainerStyle={{
            paddingTop: offsetY,
            paddingBottom: offsetY,
          }}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={isIpad ? 3 : 1}
           ListEmptyComponent={
                  <EmptyListView message={"MAKE MORE POSTS!"} character="rosie" mood={2} />
              }
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          initialNumToRender={6}
          maxToRenderPerBatch={10}
          windowSize={10}
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

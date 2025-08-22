import PostModal from "@/components/PostModal";
import { useEncryptionContext } from "@/app/contexts/EncryptionContext";
import { allColors } from "@/constants/colors";
import { formatDateTruncatedMonth, getRelativeTime, formatNumber } from "@/lib/utils";
import { Post, UserPostsGalleryProps } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { Link, useFocusEffect, useRouter } from "expo-router";
import Animated, {
  SlideInDown,
  SlideInUp,
  FadeInDown,
  FadeIn,
} from "react-native-reanimated";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useHaptics } from "@/hooks/useHaptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState, useRef, useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useNavigationContext } from "./NavigationContext";
import { useDecryptPosts } from "@/hooks/useDecrypt";
import { useDevice } from "@/app/contexts/DeviceContext";
import EmptyListView from "./EmptyList";
import ColoreActivityIndicator from "./ColoreActivityIndicator";
import { icons } from "@/constants";

// Skeleton component for post loading states with faster animations
const PostSkeleton = React.memo(() => (
  <Animated.View entering={FadeIn.duration(300)} className="w-full px-4 my-3">
    <View className="bg-gray-200 rounded-2xl w-full h-32 opacity-70" />
  </Animated.View>
));

// Skeleton UI for posts section during loading with faster animations
const PostGallerySkeleton = React.memo(() => (
  <Animated.View entering={FadeIn.duration(200)} className="w-full">
    <View className="w-full mx-8 flex flex-row items-center justify-between mb-4">
      <View className="w-32 h-6 bg-gray-200 rounded opacity-70" />
      <View className="w-16 h-4 bg-gray-200 rounded opacity-70" />
    </View>
    <PostSkeleton />
    <PostSkeleton />
    <PostSkeleton />
  </Animated.View>
));

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
  hasMore,
  skipAnimations = false
}) => {
  const { user } = useUser();
  const { isIpad } = useDevice();
  const { encryptionKey } = useEncryptionContext();
  const isOwnProfile = user!.id === profileUserId;
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sortedPosts, setSortedPosts] = useState<Post[]>([]);
  const { triggerHaptic } = useHaptics();
  const [isSaved, setIsSaved] = useState(true);
  const { stateVars, setStateVars } = useNavigationContext();
  const router = useRouter();

  // Use the new decrypt posts hook
  const { decryptPosts } = useDecryptPosts({
    encryptionKey,
    userId: profileUserId,
    debugPrefix: "PostGallery"
  });

  // Memoize the sorting function to avoid recreating it on each render
  const sortByUnread = useCallback((a: Post, b: Post) => {
    if (a.unread_comments > 0 && b.unread_comments === 0) {
      return -1;
    } else if (a.unread_comments === 0 && b.unread_comments > 0) {
      return 1;
    } else {
      return 0;
    }
  }, []);

  const filteredPosts = sortedPosts.filter((post) =>
    post.content.toLowerCase().includes(query.toLowerCase())
  );

  // New function to sort posts with pinned posts at the top
  const sortByPinnedAndUnread = useCallback((a: Post, b: Post) => {
    // First, sort by pin status (pinned posts first)
    if (a.pinned && !b.pinned) {
      return -1;
    } else if (!a.pinned && b.pinned) {
      return 1;
    }
    
    // Then sort by unread comments
    return sortByUnread(a, b);
  }, [sortByUnread]);

  useEffect(() => {
    // Use our enhanced decrypt function instead of the original logic
    if (posts.length > 0) {
      const processedPosts = decryptPosts(posts);
      // Sort first by pinned status, then by unread comments
      const sorted = [...processedPosts].sort(sortByPinnedAndUnread);
      setSortedPosts(sorted);
    } else {
      setSortedPosts([]);
    }
  }, [posts, encryptionKey, decryptPosts, sortByPinnedAndUnread]);

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
      <View className="py-5 flex items-center justify-center bg-transparent">
        <ColoreActivityIndicator />
      </View>
    );
  };

  // Map to store consistent rotation angles for each post
  const rotationAngles = useRef<Map<number, string>>(new Map());
  
  // Get or create a rotation angle for a post
  const getRotationAngle = useCallback((postId: number): string => {
    if (!rotationAngles.current.has(postId)) {
      // Create a new random rotation angle for this post
      rotationAngles.current.set(postId, `${(Math.random() * 1.5 - 0.75).toFixed(2)}deg`);
    }
    return rotationAngles.current.get(postId) || '0deg';
  }, []);

  const renderItem = ({ item }: { item: Post }) => {
    const backgroundColor =
      allColors?.find((c) => c.id === item.color)?.hex || item.color;
    const isOwner = item.user_id === user?.id;
    const hasNewComments = isOwner && item.unread_comments > 0;
    const isPinned = Boolean(item.pinned) && isOwnProfile;

    /*const isEncrypted = encryptionKey && item.recipient_user_id 
    const cleanContent = isEncrypted ? decryptText(item.content, encryptionKey) : item.content */

    return (
      // Use a wrapper component for the entering animation
      <Animated.View
        entering={FadeInDown.duration(200)}
        className="w-full mb-3"
      >
        {/* Use a nested view for the transform to avoid conflict with FadeInDown */}
        <View
          style={{
            marginHorizontal: isIpad ? 6 : 0,
            transform: [{ rotate: `${(Math.random() * 1.5 - 0.75).toFixed(2)}deg` }],
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
              className="w-full py-4 px-6 mx-auto"
              style={{
                borderRadius: 32,
                backgroundColor,
                borderColor: isPinned  ? "#ffffff" : "#ffffff90",
                borderWidth: isPinned ? 3 : 2,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isPinned ? 0.15 : 0.08,
                shadowRadius: isPinned ? 6 : 4,
                position: "relative", // For the pin icon positioning
              }}
            >
              {/* Pin Icon */}
              {isPinned && (
                <View 
                className="absolute top-3 right-3 rounded-full bg-white p-2"
                >
                  <Image
                  source={icons.pin}
                  className="w-3 h-3"

                  />
                </View>
              )}
              <Text
                className="font-JakartaSemiBold text-white/90 text-[15px] shadow leading-snug"
                numberOfLines={3}
              >
                {truncateText(item.content, 120)}
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
                      {formatNumber(item.unread_comments)} comment
                      {item.unread_comments > 1 ? "s" : ""}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
          </View>
      </Animated.View>
    );
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
            entering={FadeIn.duration(400)}
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
          handleUpdate={() => {}}
        />
      )}
    </View>
  );
};

export default UserPostsGallery;

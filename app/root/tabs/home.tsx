import PostIt from "@/components/PostIt";
import PostModal from "@/components/PostModal";
import { icons } from "@/constants";
import { Post, PostWithPosition } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  PanResponder,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DraggablePostItProps = {
  post: PostWithPosition;
  onPress: () => void;
};

const DraggablePostIt: React.FC<DraggablePostItProps> = ({ post, onPress }) => {
  const position = useRef(new Animated.ValueXY()).current; // Post-it position
  const emojiPosition = useRef(new Animated.ValueXY()).current; // Emoji position
  const clickThreshold = 2; // If the user barely moves the post-it (or doesn't move it at all) treat the gesture as a click
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // when gesture starts, set to dragging
        setIsDragging(true);
      },
      // this is called when the user moves finger
      // to initiate component movement
      onPanResponderMove: Animated.event(
        [
          null,
          {
            dx: position.x,
            dy: position.y,
          },
        ],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (event, gestureState) => {
        const dx = gestureState.dx;
        const dy = gestureState.dy;
        // //console.log(dx, dy);
        position.extractOffset(); // reset the offset so transformations don't accumulate

        if (Math.abs(dx) < clickThreshold && Math.abs(dy) < clickThreshold) {
          onPress();
        }
        setIsDragging(false);
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        transform: position.getTranslateTransform(),
        opacity: 1,
        position: "absolute",
        top: post.position.top,
        left: post.position.left,
      }}
    >
      <TouchableOpacity onPress={onPress}>
        <PostIt color={post.color || "yellow"} />
      </TouchableOpacity>

      <Text
        style={{
          position: "absolute",
          left: Math.random() * 100,
          top: Math.random() * 100,
          fontSize: 50,
        }}
      >
        {post.emoji}
      </Text>
    </Animated.View>
  );
};

export default function Page() {
  //const { user } = useUser();
  ////console.log(user);
  //const { isLoaded, isSignedIn, session } = useSession();
  ////console.log("session: ", session);
  //useAuth();
  //router.replace("/auth/log-in");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const { user } = useUser();

  const fetchRandomPosts = async () => {
    try {
      const response = await fetch(
        `/api/posts/getRandomPosts?number=${4}&id=${user!.id}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const result = await response.json();
      // set positions of posts
      const postsWithPositions = result.data.map((post: Post) => ({
        ...post,
        position: {
          top: Math.random() * 500,
          left: Math.random() * 250,
        },
      }));
      setPosts(postsWithPositions);
    } catch (error) {
      setError("Failed to fetch new posts.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNewPost = async () => {
    try {
      const response = await fetch(
        `/api/posts/getRandomPosts?number=${1}&id=${user!.id}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const result = await response.json();
      // Add position to the new post
      const newPostWithPosition = result.data.map((post: Post) => ({
        ...post,
        position: {
          top: Math.random() * 500,
          left: Math.random() * 250,
        },
      }));
      return newPostWithPosition[0];
    } catch (error) {
      setError("Failed to fetch new post.");
      console.error(error);
      return null;
    }
  };

  useEffect(() => {
    fetchRandomPosts();

    // Fetch the first post (one random post)
    const fetchAndSetNewPost = async () => {
      const newPost = await fetchNewPost();
      if (newPost) {
        setPosts((prevPosts) => [...prevPosts, newPost]); // Add the new post to the list
      }
    };

    fetchAndSetNewPost();
  }, []);

  const handlePostPress = (post: any) => {
    setSelectedPost(post);
  };

  const handleNewPostPress = () => {
    router.push("/root/new-post");
  };

  const handleCloseModal = async () => {
    if (selectedPost) {
      setPosts((prevPosts) =>
        prevPosts.filter((post) => post.id !== selectedPost.id)
      );

      // Fetch a new post to replace the removed one
      const newPost = await fetchNewPost();
      if (newPost) {
        setPosts((prevPosts) => [...prevPosts, newPost]);
      }

      setSelectedPost(null);
    }
  };

  const handleReloadPosts = () => {
    setLoading(true);
    fetchRandomPosts();
  };

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <View className="flex-row justify-between items-center mx-7 mt-3">
          <Image
            source={require("@/assets/colore-word-logo.png")}
            style={{ width: 120, height: 50 }}
            resizeMode="contain"
            accessibilityLabel="Colore logo"
          />

          <TouchableOpacity onPress={handleNewPostPress}>
            <Image source={icons.pencil} className="w-7 h-7" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-[0.8] justify-center items-center">
            <ActivityIndicator size="large" color="black" />
          </View>
        ) : error ? (
          <Text>{error}</Text>
        ) : (
          <View className="flex-1">
            <ScrollView
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={handleReloadPosts}
                />
              }
              style={{ position: "absolute", width: "100%", height: "100%" }}
            />

            <View className="relative">
              {posts.map((post, index) => {
                return (
                  // <TouchableOpacity
                  //   key={post.id}
                  //   onPress={() => handlePostPress(post)}
                  //   style={{
                  //     position: "absolute",
                  //     top: post.position.top,
                  //     left: post.position.left,
                  //   }}
                  // >
                  //   <DraggablePostIt />
                  // </TouchableOpacity>
                  <DraggablePostIt
                    key={post.id}
                    post={post}
                    onPress={() => handlePostPress(post)}
                  />
                );
              })}
            </View>

            {selectedPost && (
              <PostModal
                isVisible={!!selectedPost}
                post={selectedPost}
                handleCloseModal={handleCloseModal}
              />
            )}
          </View>
        )}
      </SignedIn>
    </SafeAreaView>
  );
}

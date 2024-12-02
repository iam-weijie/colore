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
  const position = useRef(new Animated.ValueXY()).current;
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
        opacity: isDragging ? 0.8 : 1,
        position: "absolute",
        top: post.position.top,
        left: post.position.left,
      }}
    >
      <TouchableOpacity onPress={onPress}>
        <PostIt color={post.color || "yellow"} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function Page() {
  //const { user } = useUser();
  ////console.log(user);
  //const { isLoaded, isSignedIn, session } = useSession();
  ////console.log("session: ", session);
  //useAuth();
  //router.replace("/(auth)/log-in");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const { user } = useUser();

  const fetchRandomPosts = async () => {
    try {
      const response = await fetch(
        `/(api)/(posts)/getRandomPosts?number=${3}&id=${user!.id}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const result = await response.json();
      // set positions of posts
      const postsWithPositions = result.data.map((post: Post) => ({
        ...post,
        position: {
          top: Math.random() * 150,
          left: Math.random() * 200,
        },
      }));
      setPosts(postsWithPositions);
    } catch (error) {
      setError("Failed to fetch random posts.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomPosts();
  }, []);

  const handlePostPress = (post: any) => {
    setSelectedPost(post);
  };

  const handleNewPostPress = () => {
    router.push("/(root)/new-post");
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
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
            style={{ width: 330, height: 50 }}
            resizeMode="contain"
            accessibilityLabel="Colore logo"
          />
        </View>

        {loading ? (
          <View className="flex-[0.8] justify-center items-center">
            <ActivityIndicator size="large" color="black" />
          </View>
        ) : error ? (
          <Text>{error}</Text>
        ) : (
          <View className="relative flex-1">
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

            {selectedPost && (
              <PostModal
                isVisible={!!selectedPost}
                post={selectedPost}
                handleCloseModal={handleCloseModal}
              />
            )}
          </View>
        )}

        <View className="absolute bottom-32 right-6 flex flex-col items-center space-y-8 z-10">
          <TouchableOpacity onPress={handleReloadPosts}>
            <Image source={icons.refresh} className="w-8 h-8" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNewPostPress}>
            <Image source={icons.pencil} className="w-7 h-7" />
          </TouchableOpacity>
        </View>
      </SignedIn>
    </SafeAreaView>
  );
}

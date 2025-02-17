import PostIt from "@/components/PostIt";
import PostModal from "@/components/PostModal";
import { useGlobalContext } from "@/app/globalcontext";
import { icons } from "@/constants";
import { Post, PostWithPosition } from "@/types/type";
import { useNotification } from '@/notifications/NotificationContext';
import { sendPushNotification } from '@/notifications/PushNotificationService';
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  PanResponder,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DraggablePostItProps = {
  post: PostWithPosition;
  updateIndex: () => void;
  updatePosition: (x: number, y:number, post: PostWithPosition) => void;
  onPress: () => void;
};

type MappingPostitProps = {
  id: number;
  coordinates: {
    x_coordinate: number;
    y_coordinate: number;
  };
};

const MappingPostIt = ({ id, coordinates }: MappingPostitProps) => {
return { 
  "id": id,
   "coordinates": 
   {
    "x_coordinate": coordinates.x_coordinate, 
    "y_coordinate": coordinates.y_coordinate
   } 
  }
}

const DraggablePostIt: React.FC<DraggablePostItProps> = ({ post, updateIndex, updatePosition, onPress }) => {
    const position = useRef(new Animated.ValueXY()).current;
    const clickThreshold = 2; // If the user barely moves the post-it (or doesn't move it at all) treat the gesture as a click
    const [isDragging, setIsDragging] = useState<boolean>(false);
  
    useEffect(() => {
      const listenerId = position.addListener(({ x, y }) => {
        updatePosition(x, y, post);
      });
  
      return () => {
        position.removeListener(listenerId);
      };
    }, [position, post, updatePosition]);
  
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          // when gesture starts, set to dragging and moves it the the front
          setIsDragging(true);
          updateIndex();
          position.extractOffset();
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
        <TouchableWithoutFeedback onPress={onPress}>
          <PostIt color={post.color || "yellow"} />
        </TouchableWithoutFeedback>
  
        <Text
          style={{
            position: "absolute",
            left: Math.random() * 100,
            top: Math.random() * 100,
            fontSize: 50,
          }}
        >
          {post.emoji && post.emoji}
        </Text>
      </Animated.View>
    );
  };

declare interface PostItBoardProps {
    userId: string;
    handlePostsRefresh: () => Promise<Post[]>;
    handleBack?: () => void;
    handleNewPostFetch: () => Promise<Post>;
    onWritePost: () => void;
}

const PostItBoard: React.FC<PostItBoardProps> = ({
    userId, 
    handlePostsRefresh,
    handleNewPostFetch,
}) => {
  const [postsWithPosition, setPostsWithPosition] = useState<PostWithPosition[]>([]);
  const {stacks, setStacks } = useGlobalContext(); // Add more global constants here
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostWithPosition | null>(null);
  const [maps, setMap] = useState<MappingPostitProps[]>([]);

  const fetchRandomPosts = async () => {
    try {
      const posts: Post[] = await handlePostsRefresh();
      // set positions of posts
      const postsWithPositions = posts.map((post: Post) => ({
        ...post,
        position: {
          top: Math.random() * 400 + 50,
          left: Math.random() * 250,
        },
      }));
    // Initialize each post as a stack
      const initialStacks = postsWithPositions.map((post: PostWithPosition) => ({
        ids: [post.id],
        elements: [post],
      }));
      setPostsWithPosition(postsWithPositions);
      setStacks(initialStacks);
      // Initialize to add to map
      const initialMap = postsWithPositions.map((post: PostWithPosition) => 
        MappingPostIt({
            id: post.id, 
            coordinates: {
                "x_coordinate": post.position.left,
                "y_coordinate": post.position.top
            }
        }));
        // console.log(initialMap);
        setMap(initialMap);
    } catch (error) {
      setError("Failed to fetch new posts.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStacks = (postId: number, newCoordinates: {x_coordinate: number, y_coordinate: number}) => {

    let updatedStacks = [...stacks];
    let postsToCombine = new Set([postId]); // Set of post IDs to combine into a single stack

    // Check proximity to all posts
    maps.forEach((mappedPost) => {
      if (mappedPost.id !== postId) {
        const dist = distanceBetweenPosts(
          newCoordinates.x_coordinate,
          newCoordinates.y_coordinate,
          mappedPost.coordinates.x_coordinate,
          mappedPost.coordinates.y_coordinate
        
        );
  
        if (dist <= 15) {
          postsToCombine.add(mappedPost.id); // Add all nearby posts
        }
      }
    });
  
    // Update stacks by removing the moving post from any stack it belongs to
    updatedStacks = updatedStacks.map((stack) => ({
      ...stack,
      ids: stack.ids.filter((id: number) => id !== postId),
     elements: stack.elements.length > 0 
     ? stack.elements.filter((post: PostWithPosition) => post.id !== postId) 
     : stack.elements
    }));
  
    // Remove empty stacks
    updatedStacks = updatedStacks.filter((stack) => stack.ids.length > 0);
  
    // Check if postsToCombine should form a new stack or merge with existing ones
    const affectedStacks = updatedStacks.filter((stack) =>
      stack.ids.some((id: number) => postsToCombine.has(id))
    );
  
    if (affectedStacks.length === 0 && postsToCombine.size > 1) {
      // No existing stack: create a new one if there's more than one post
      updatedStacks.push({ 
        ids: Array.from(postsToCombine), 
        elements: postsToCombine.size > 1 ? postsToCombine : [] });
    } else if (affectedStacks.length > 0) {
      // Merge all affected stacks and postsToCombine into one stack
      const mergedStackIds = new Set();
  
      affectedStacks.forEach((stack) => {
        stack.ids.forEach((id: number) => mergedStackIds.add(id));
      });
  
      postsToCombine.forEach((id) => mergedStackIds.add(id));
  
      // Remove old affected stacks and add the new merged stack
      updatedStacks = updatedStacks.filter(
        (stack) => !affectedStacks.includes(stack)
      );
      updatedStacks.push({ 
        ids: Array.from(mergedStackIds), 
        elements: Array.from(mergedStackIds).map((id) => postsWithPosition.find((post) => post.id === id))});
    }
  
    // Remove posts from stacks if they're no longer within range of each other
    updatedStacks = updatedStacks.map((stack) => ({
      ...stack,
      ids: stack.ids.filter((id: number) => {
        const currentPost = maps.find((p) => p.id === id);
        if (!currentPost) return false; // If data is missing, remove the post
  
        // Check if any other post in the stack is still within range
        return stack.ids.some((otherId: number) => {
          if (id === otherId) return true; // Skip self-comparison
          const otherPost = maps.find((p) => p.id === otherId);
          if (!otherPost) return false;
  
          const dist = distanceBetweenPosts(
            currentPost.coordinates.x_coordinate,
            currentPost.coordinates.y_coordinate,
            otherPost.coordinates.x_coordinate,
            otherPost.coordinates.y_coordinate
          );
          return dist <= 15;
        });
      }),
    }));
  
    // Filter out empty stacks
    updatedStacks = updatedStacks.filter((stack) => stack.ids.length > 0);
  
    setStacks(updatedStacks);
  };

  const distanceBetweenPosts = (x_ref: number, y_ref: number, x: number, y: number) => {
    const x_diff = x_ref - x
    const y_diff = y_ref - y
    const distance = Math.sqrt(x_diff**2 + y_diff**2)
    return distance
  }
  const updatePostPosition = (dx: number, dy: number, post: PostWithPosition) => {

    const id = post.id;
    const x = post.position.left + dx
    const y = post.position.top + dy

    const postItCoordinates = MappingPostIt({id: id, coordinates: {x_coordinate: x, y_coordinate: y}})
    setMap((prevMap) => [
      ...prevMap.filter((p) => p.id !== id),
      postItCoordinates,
    ]);
  }

  const reorderPost = (topPost: PostWithPosition) => {
    setPostsWithPosition((prevPosts: PostWithPosition[]) => [
      ...prevPosts.filter((post) => post.id !== topPost.id), // Remove the moved post
      topPost, // Add the moved post to the end
    ]);
    
  };
  useEffect(() => {
    if (maps.length > 1) {
        const newPostID = maps[maps.length - 1].id;
        const newPostScreenCoordinates = maps[maps.length - 1].coordinates;
        updateStacks(newPostID, newPostScreenCoordinates);
    }
  }, [maps]);

  useEffect(() => {
    fetchRandomPosts();
  }, []);

  const handlePostPress = (post: PostWithPosition) => {
      setSelectedPost(post);
  };

  const handleCloseModal = async () => {
    if (selectedPost) {
      setPostsWithPosition((prevPosts) =>
        prevPosts.filter((post) => post.id !== selectedPost.id)
      );
  
      let newPost: Post | null = null;
      let newPostWithPosition: PostWithPosition | null = null;
  
      do {
        newPost = await handleNewPostFetch();
        if (newPost) {
          newPostWithPosition = {
            ...newPost,
            position: {
              top: Math.random() * 400 + 50,
              left: Math.random() * 250,
            },
          };
        }
      } while (newPost && postsWithPosition.some((post) => post.id === newPost!.id));
      if (newPostWithPosition) {
        setPostsWithPosition((prevPosts) => [...prevPosts, newPostWithPosition]);
      }
      setSelectedPost(null);
    }
  };

  const handleReloadPosts = () => {
    setLoading(true);
    fetchRandomPosts();
  };
//  console.log("Stacks: ", stacks)

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>

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
              {postsWithPosition.map((post, index) => {
                return (
                  <DraggablePostIt 
                    key={post.id}
                    updateIndex={() => reorderPost(post)}
                    updatePosition={(dx, dy, post) => updatePostPosition(dx, dy, post)}
                    post={post}
                    onPress={() => handlePostPress(post)
                    }
                  />
                );
              })}
            </View>

            {selectedPost && (
              <PostModal
                isVisible={!!selectedPost}
                selectedPost={selectedPost}
                handleCloseModal={handleCloseModal}
              />
            )}
          </View>
        )}
      </SignedIn>
    </SafeAreaView>
  );
}

export default PostItBoard;
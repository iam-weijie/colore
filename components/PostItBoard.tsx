import PostIt from "@/components/PostIt";
import PostModal from "@/components/PostModal";
import { temporaryColors } from "@/constants";
import { useGlobalContext } from "@/app/globalcontext";
import { Post, PostWithPosition } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
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
  updatePosition: (x: number, y: number, post: PostWithPosition) => void;
  onPress: () => void;
  showText?: boolean;
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
    id: id,
    coordinates: {
      x_coordinate: coordinates.x_coordinate,
      y_coordinate: coordinates.y_coordinate,
    },
  };
};

const DraggablePostIt: React.FC<DraggablePostItProps> = ({
  post,
  updateIndex,
  updatePosition,
  onPress,
  showText = false,
}) => {
  const position = useRef(new Animated.ValueXY()).current;
  const clickThreshold = 2; // If the user barely moves the post-it (or doesn't move it at all) treat the gesture as a click
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fontColor, setFontColor] = useState<string>("#0000ff");

  const getFontColorHex = (colorName: string | undefined) => {
      const foundColor = temporaryColors.find((c) => c.name === colorName);
      setFontColor(foundColor?.fontColor || "#ff0000"); // Default font colour is black
    };

  useEffect(() => {
    const listenerId = position.addListener(({ x, y }) => {
      updatePosition(x, y, post);
    });

    return () => {
      position.removeListener(listenerId);
    };
  }, [position, post, updatePosition]);

  useEffect(() => {
    getFontColorHex(post.color);
  }, []);

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

      {!showText && (
        <View className="absolute text-black w-full h-full items-center justify-center">
        <Text
          style={{
            fontSize: 50
          }}
        >
          {post.emoji && post.emoji}
        </Text>
        </View>
      )}
      {showText && (
        <View className="absolute text-black w-full h-full items-center justify-center">
        <Text
          className="font-[500] text-black"
          style={{
            color: fontColor,
            fontSize: 16,
            padding: 15,
            numberOfLines: 3,
            fontStyle: "italic"
          }}
          numberOfLines={3} 
          ellipsizeMode="tail"
        >
          {post.content}
        </Text>
        </View>
      )}
    </Animated.View>
  );
};

declare interface PostItBoardProps {
  userId: string;
  handlePostsRefresh: () => Promise<Post[]>;
  handleBack?: () => void;
  handleNewPostFetch: (excludeIds: number[]) => Promise<Post>; // do not refetch IDs
  allowStacking: boolean;
  showPostItText?: boolean;
  invertColors?: boolean;
}

const PostItBoard: React.FC<PostItBoardProps> = ({
  userId,
  handlePostsRefresh,
  handleNewPostFetch,
  showPostItText = false,
  invertColors = false
}) => {
  const [postsWithPosition, setPostsWithPosition] = useState<
    PostWithPosition[]
  >([]);
  const { stacks, setStacks } = useGlobalContext(); // Add more global constants here
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostWithPosition | null>(
    null
  );
  const [maps, setMap] = useState<MappingPostitProps[]>([]);

  if (!userId) {
    return null;
  }


  const fetchRandomPosts = async () => {

    try {
      const posts: Post[] = await handlePostsRefresh();
      // set positions of posts
      const postsWithPositions = posts.map((post: Post) => ({
        ...post,
        position: {
          top: Math.random() * 775 / 2,
          left: Math.random() * 475 / 2,
        },
      }));
      // Initialize each post as a stack
      const initialStacks = postsWithPositions.map(
        (post: PostWithPosition) => ({
          ids: [post.id],
          elements: [post],
        })
      );
      setPostsWithPosition(postsWithPositions);
      setStacks(initialStacks);
      // Initialize to add to map
      const initialMap = postsWithPositions.map((post: PostWithPosition) =>
        MappingPostIt({
          id: post.id,
          coordinates: {
            x_coordinate: post.position.left,
            y_coordinate: post.position.top,
          },
        })
      );
      // console.log(initialMap);
      setMap(initialMap);
    } catch (error) {
      setError("Failed to fetch new posts.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStacks = (
    postId: number,
    newCoordinates: { x_coordinate: number; y_coordinate: number }
  ) => {
    let updatedStacks = [...stacks];
    let postsToCombine = [postId]; // Set of post IDs to combine into a single stack

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
          postsToCombine.push(mappedPost.id); // Add all nearby posts
        }
      }
    });
    
     // Remove empty stacks
     updatedStacks = updatedStacks.filter((stack) => stack.ids.length > 0);

    

     // Update stacks by removing the moving post from any stack it belongs to
      updatedStacks = updatedStacks.map((stack) => ({
        ...stack,
        ids: stack.ids.filter((id: number) => id !== postId),
        elements:
          stack.elements.length > 0
            ? stack.elements.filter(
                (post: PostWithPosition) => post.id !== postId
              )
            : stack.elements,
      }));
  
 

   


    // Check if postsToCombine should form a new stack or merge with existing ones
    const affectedStacks = updatedStacks.filter((stack) =>
      stack.ids.some((id: number) => postsToCombine.includes(id))
    );

    if (affectedStacks.length === 0 && postsToCombine.length > 1) {
      // No existing stack: create a new one if there's more than one post
      updatedStacks.push({
        ids: Array.from(postsToCombine),
        elements: postsToCombine.length > 1 ? postsToCombine : [],
      });
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
        elements: Array.from(mergedStackIds).map((id) =>
          postsWithPosition.find((post) => post.id === id)
        ),
      });
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
    updatedStacks = updatedStacks.filter((stack) => stack.ids.length > 1);

    setStacks(updatedStacks);
  };

  const distanceBetweenPosts = (
    x_ref: number,
    y_ref: number,
    x: number,
    y: number
  ) => {
    const x_diff = x_ref - x;
    const y_diff = y_ref - y;
    const distance = Math.sqrt(x_diff ** 2 + y_diff ** 2);
    return distance;
  };
  const updatePostPosition = (
    dx: number,
    dy: number,
    post: PostWithPosition
  ) => {
    const id = post.id;
    const x = post.position.left + dx;
    const y = post.position.top + dy;

    const postItCoordinates = MappingPostIt({
      id: id,
      coordinates: { x_coordinate: x, y_coordinate: y },
    });
    setMap((prevMap) => [
      ...prevMap.filter((p) => p.id !== id),
      postItCoordinates,
    ]);
  };

  const reorderPost = (topPost: PostWithPosition) => {
    setPostsWithPosition((prevPosts: PostWithPosition[]) => [
      ...prevPosts.filter((post) => post.id !== topPost.id), // Remove the moved post
      topPost, // Add the moved post to the end
    ]);
  };

  // USE EFFECTS
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
    // Ensure all required properties are present
    const formattedPost: PostWithPosition = {
      id: post.id,
      clerk_id: post.clerk_id,
      content: post.content,
      created_at: post.created_at,
      like_count: post.like_count || 0,
      report_count: post.report_count || 0,
      unread_comments: post.unread_comments || 0,
      color: post.color,
      emoji: post.emoji,
      firstname: post.firstname,
      username: post.username,
      city: post.city,
      state: post.state,
      country: post.country,
      position: post.position,
    };
    setSelectedPost(formattedPost);
  };


  // HANDLING MODAL
  const handleCloseModal = async () => {
    if (selectedPost) {
      const postId = selectedPost.id

       setSelectedPost(null);
      //("Post to remove", selectedPost.id)
      setPostsWithPosition((prevPosts) =>
        prevPosts.filter((post) => post.id !== postId)
      );
      
      setStacks((prevStacks) => {
        const updatedStacks = prevStacks.map((stack) => ({
          ...stack,
          ids: stack.ids.filter((id: number) => id !== postId),
        }));
        return updatedStacks.filter((stack) => stack.ids.length > 1);
      });

      setMap((prevMap) => {
        const updateMap = prevMap.filter((c) => c.id != postId)

        return updateMap
      });
      //("remainging right after", stacks)
  
      const existingPostIds = postsWithPosition.map((post) => post.id);
      const newPost = await handleNewPostFetch(existingPostIds);

      if (newPost && !existingPostIds.includes(newPost.id)) {
        const newPostWithPosition: PostWithPosition = {
          ...newPost,
          position: {
            top: Math.random() * 400 + 50,
            left: Math.random() * 250,
          },
        };
        setPostsWithPosition((prevPosts) => [
          ...prevPosts,
          newPostWithPosition,
        ]);
      }

  
  
      
    }
  };

  const handleReloadPosts = () => {
    setLoading(true);
    fetchRandomPosts();
  };

  //console.log("remainging loaded", stacks)
  return (
    <View className="flex-1 mb-[80px]">
      <SignedIn>
        {loading ? (
          <View className="flex-[0.8] justify-center items-center">
            <ActivityIndicator size="large" color="black" />
          </View>
        ) : error ? (
          <Text>{error}</Text>
        ) : (
          <View className="flex-1 w-full h-full">
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
                    updatePosition={(dx, dy, post) =>
                      updatePostPosition(dx, dy, post)
                    }
                    post={post}
                    onPress={() => handlePostPress(post)}
                    showText={showPostItText}
                  />
                );
              })}
            </View>

            {selectedPost && (
              <PostModal
                isVisible={!!selectedPost}
                selectedPost={selectedPost}
                handleCloseModal={handleCloseModal}
                invertedColors={invertColors}
              />
            )}
          </View>
        )}
      </SignedIn>
    </View>
  );
};

export default PostItBoard;

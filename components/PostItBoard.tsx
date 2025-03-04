import { useGlobalContext } from "@/app/globalcontext";
import PostIt from "@/components/PostIt";
import PostModal from "@/components/PostModal";
import { icons, temporaryColors } from "@/constants";
import { Post, PostWithPosition } from "@/types/type";
import { SignedIn } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image, 
  PanResponder,
  RefreshControl,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type MappingPostitProps = {
  id: number;
  coordinates: {
    x_coordinate: number;
    y_coordinate: number;
  };
};

type DraggablePostItProps = {
  post: PostWithPosition;
  updateIndex: () => void;
  updatePosition: (x: number, y: number, post: PostWithPosition) => void;
  onPress: () => void;
  forceStack: (id: number) => MappingPostitProps;
  showText?: boolean;
};

const screenHeight = Dimensions.get("screen").height;
const screenWidth = Dimensions.get("screen").width;

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
  forceStack,
  showText = false,
}) => {
  const position = useRef(new Animated.ValueXY()).current;
  const clickThreshold = 2;
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fontColor, setFontColor] = useState<string>("#0000ff");
  const { stacks, setStacks } = useGlobalContext();
  const [newPosition, setNewPosition] = useState<MappingPostitProps | null>(null);
  const [isPinned, setIsPinned] = useState<boolean>(post.pinned);

  const hasUpdatedPosition = useRef(false);

  const getFontColorHex = (colorName: string | undefined) => {
    const foundColor = temporaryColors.find((c) => c.name === colorName);
    setFontColor(foundColor?.fontColor || "#ff0000");
  };

  const newStackedPosition = useMemo(() => {
    return forceStack(post.id); // Memoize newStackedPosition to prevent recalculation
  }, [forceStack, post.id]);

  // Separate useEffect for setNewPosition
  useEffect(() => {
    setNewPosition((prev) => {
      const prevX = prev?.coordinates?.x_coordinate ?? 0;
      const prevY = prev?.coordinates?.y_coordinate ?? 0;

      const newX = newStackedPosition.coordinates.x_coordinate;
      const newY = newStackedPosition.coordinates.y_coordinate;

      if (
        Math.abs(prevX - newX) < 1 &&
        Math.abs(prevY - newY) < 1
      ) {
        return prev; // No change, do not trigger re-render
      }
      return newStackedPosition; // Update with new position
    });
  }, [newStackedPosition]); // This runs only when newStackedPosition changes

  // Original `useEffect` for handling position updates
  useEffect(() => {
    if (isPinned) return;
    const listenerId = position.addListener(({ x, y }) => {
      updatePosition(x, y, post);
    });

    return () => {
      position.removeListener(listenerId);
    };
  }, [position, updatePosition, post]);
  useEffect(() => {
   // console.log("id", post.id, "is pinned?", post.pinned)
    setIsPinned(post.pinned)
  }, [post])

  useEffect(() => {
    if (isPinned) return;
    if (stacks.length === 1 && newPosition && !hasUpdatedPosition.current) {
      const dx =
        newPosition.coordinates.x_coordinate -
        post.position.left -
        position.x.__getValue();
      const dy =
        newPosition.coordinates.y_coordinate -
        post.position.top -
        position.y.__getValue();

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        Animated.timing(position, {
          toValue: { x: dx + Math.random() * 15, y: dy + Math.random() * 15 },
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }).start();
        hasUpdatedPosition.current = true;
      }
    }
  }, [forceStack, newPosition, stacks]);

  useEffect(() => {
    getFontColorHex(post.color);
  }, [post.color]);

  useEffect(() => {
    if (stacks.length == 0) {
      hasUpdatedPosition.current = false; // Reset the flag when the stack is empty
    }
  }, [stacks]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        
        updateIndex();
        if (isPinned) {
          onPress()
          return
        };
        setIsDragging(true);
        position.extractOffset();
      },
      onPanResponderMove: (event, gestureState) => {
        if (!isPinned) {
          position.setValue({ x: gestureState.dx, y: gestureState.dy });
        }
      },
      onPanResponderRelease: (event, gestureState) => {
        if (isPinned) return;
        const dx = gestureState.dx;
        const dy = gestureState.dy;
        position.extractOffset();

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
        left: post.position.left
      }}
    >
      <TouchableWithoutFeedback onPress={onPress}>
        <PostIt color={post.color || "yellow"} />
      </TouchableWithoutFeedback>
      {isPinned && (
        <View className="absolute text-black h-full -top-2 -left-2">
          <View className="p-[6px] rounded-full bg-[#fafafa] flex-row items-center justify-start">
          <Image 
           source={icons.pin}
           tintColor="black"
           resizeMode="contain"
           className="w-7 h-7"
           style={{
            opacity: 0.8,
            transform: [{ scaleX: -1 }] // This flips the image vertically
          }}/>
           </View>
        
      </View>
      )}
      {!showText && (
        <View className="absolute text-black w-full h-full items-center justify-center">
          <Text style={{ fontSize: 50 }}>{post.emoji && post.emoji}</Text>
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
              fontStyle: "italic",
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
  handleUpdatePin: (ids: number[]) => void;
  allowStacking: boolean;
  showPostItText?: boolean;
  invertColors?: boolean;
}

const PostItBoard: React.FC<PostItBoardProps> = ({
  userId,
  handlePostsRefresh,
  handleNewPostFetch,
  handleUpdatePin,
  showPostItText = false,
  invertColors = false,
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
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [maps, setMap] = useState<MappingPostitProps[]>([]);

  if (!userId) {
    return null;
  }

  const AlgorithmRandomPosition = (isPinned: boolean) => {

      if (isPinned) {
        return {top: 60 + Math.random() * 15, left: 40 + Math.random() * Math.sqrt(15) }
      } else {
        const top = ((Math.random() - 0.5) * 2) * screenHeight / 4 + screenHeight / 4;
        const left = ((Math.random() - 0.5) * 2) * screenWidth / 4 + screenWidth / 4
        return {
          top:  top,
          left: left
        }
      }
  }

  const fetchRandomPosts = async () => {
    try {
      const posts: Post[] = await handlePostsRefresh();
      // set positions of posts
      const postsWithPositions = posts.map((post: Post) => ({
        ...post,
        position: {
          top:  AlgorithmRandomPosition(post.pinned).top,
          left: AlgorithmRandomPosition(post.pinned).left,
        },
      }));
      // Initialize each post as a stack
      setStacks((prevStack) => prevStack.filter((stack) => stacks))
      setPostsWithPosition(postsWithPositions);
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

      initialMap.forEach((p: MappingPostitProps, index: number) => {
        
          const newPostID = p.id;
          const newPostScreenCoordinates = initialMap[initialMap.length - 1].coordinates;
          updateStacks(newPostID, newPostScreenCoordinates);
        
      })
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
      elements: stack.elements.filter((post: PostWithPosition) => post.id !== postId),
    }));
  
    // Check if postsToCombine should form a new stack or merge with existing ones
    const affectedStacks = updatedStacks.filter((stack) =>
      stack.ids.some((id: number) => postsToCombine.includes(id))
    );
  
    // Create a new stack only if there are valid posts to combine
    const validPosts = postsToCombine
      .map((id) => postsWithPosition.find((post) => post.id === id))
      .filter((post) => post !== undefined);
  
    if (affectedStacks.length === 0 && validPosts.length > 1) {
      // No existing stack: create a new one if there's more than one valid post
      updatedStacks.push({
        ids: validPosts.map((post) => post.id),
        elements: validPosts,
      });
    } else if (affectedStacks.length > 0) {
      // Merge all affected stacks and postsToCombine into one stack
      const mergedStackIds = new Set();
  
      affectedStacks.forEach((stack) => {
        stack.ids.forEach((id: number) => mergedStackIds.add(id));
      });
  
      validPosts.forEach((post) => mergedStackIds.add(post.id));
  
      // Remove old affected stacks and add the new merged stack
      updatedStacks = updatedStacks.filter(
        (stack) => !affectedStacks.includes(stack)
      );
      updatedStacks.push({
        ids: Array.from(mergedStackIds),
        elements: Array.from(mergedStackIds)
          .map((id) => postsWithPosition.find((post) => post.id === id))
          .filter((post) => post !== undefined),
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
  
    // Filter out empty stacks and stacks with no valid posts
    updatedStacks = updatedStacks.filter(
      (stack) => stack.ids.length > 0 && stack.elements.length > 0
    );
  
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
      //console.log(stacks)
    }
    //console.log("maps", maps, maps.length)
    //console.log("stacks", stacks)
  }, [maps]);

  useEffect(() => {
    fetchRandomPosts();
  }, []);

  const forceStack = (id: number) => {
    return maps.find((p) => p.id == id);
  };
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
      pinned: post.pinned,
      recipient_user_id: post.recipient_user_id,
      firstname: post.firstname,
      username: post.username,
      city: post.city,
      state: post.state,
      country: post.country,
      position: post.position,
    };
    setSelectedPost(formattedPost);
    setIsPinned(post.pinned)
  };

  // HANDLING MODAL

const handleUpdatePosts = async () => {
  const existingPostIds = postsWithPosition.map((post) => post.id);

  try {
    const response = await fetchAPI(`/api/posts/getPostsById?ids=${existingPostIds}`);
    const updatedPosts: Post[] = response.data;

    const updatedPostsMap = new Map(updatedPosts.map(post => [post.id, post]));

    // Create a new array with updated posts
    const updatedPostsWithPosition = postsWithPosition.map(post => {
      const updatedPost = updatedPostsMap.get(post.id);
      if (updatedPost) {
        return {
          ...updatedPost,
          position: post.position, // Retain the original position
        };
      }
      return post;
    });

    // Update the state with the new array
    setPostsWithPosition(updatedPostsWithPosition);
      // Force re-render
   

  } catch (error) {
    console.error("Failed to update posts: ", error);
  }
};

  const handleIsPinned = (isPinned: boolean) => {
    setIsPinned(isPinned)
    const existingPostIds = postsWithPosition.map((post) => post.id);
    handleUpdatePin(existingPostIds)
  }

  const handleCloseModal = async () => {
    if (selectedPost && !isPinned) {
      const postId = selectedPost.id;
      setSelectedPost(null);

      
      //("Post to remove", selectedPost.id)
      setPostsWithPosition((prevPosts) => {
        const updatePosts = prevPosts.filter((post) => post.id !== postId);

        return updatePosts;
      });

      setStacks((prevStacks) => {
        const updatedStacks = prevStacks.map((stack) => ({
          ...stack,
          ids: stack.ids.filter((id: number) => id !== postId),
        }));
        return updatedStacks.filter((stack) => stack.ids.length > 1);
      });

      setMap((prevMap) => {
        const updateMap = prevMap.filter((c) => c.id != postId);

        return updateMap;
      });

      //("remainging right after", stacks)

      const existingPostIds = postsWithPosition.map((post) => post.id);

      const newPost = await handleNewPostFetch(existingPostIds);

      if (newPost && !existingPostIds.includes(newPost.id)) {
        const newPostWithPosition: PostWithPosition = {
          ...newPost,
          position: {
            top: newPost.pinned ? 70 + Math.random() * 15 : Math.random() * 775 / 2,
            left: newPost.pinned ? 50 + Math.random() * 15 : Math.random() * 475 / 2,
          },
        };
        setPostsWithPosition((prevPosts) => [
          ...prevPosts,
          newPostWithPosition,
        ]);
        updatePostPosition(0, 0, newPostWithPosition);
      }

      // Wait for React state updates to finish before using remainingPosts
      await new Promise((resolve) => setTimeout(resolve, 0));
    } else {
      setSelectedPost(null)
    }
  }

  

  const handleReloadPosts = () => {
    setLoading(true);
    fetchRandomPosts();
  };

  const handleGatherPosts = () => {
    const ref = maps[maps.length - 1].coordinates;
    const newPostsPostions = postsWithPosition.map((post) => ({
      id: post.id,
      coordinates: {
        x_coordinate: ref.x_coordinate,
        y_coordinate: ref.y_coordinate,
      },
    }));
    //console.log("newPostsPostions")
    setMap(newPostsPostions);
    //console.log("new posts", newPostsPostions)
  };

  //console.log("remaingring loaded", stacks)
  return (
    <View className="flex-1 mb-[80px]">
      <SignedIn>
        <TouchableWithoutFeedback
          className="flex-1 w-full h-full"
          onLongPress={handleGatherPosts}
        >
          {error ? (
            <Text>{error}</Text>
          ) : (
            <View className="flex-1 w-full h-full">
              {
                /*loading */ false && (
                  <View className="flex-[0.8] justify-center items-center">
                    <ActivityIndicator size="large" color="black" />
                  </View>
                )
              }
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
                      forceStack={forceStack}
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
                  handleUpdate={(isPinned: boolean) => handleIsPinned(isPinned)}
                  invertedColors={invertColors}
                />
              )}
            </View>
          )}
        </TouchableWithoutFeedback>
      </SignedIn>
    </View>
  );
};

export default PostItBoard;

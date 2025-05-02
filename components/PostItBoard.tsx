import { useGlobalContext } from "@/app/globalcontext";
import PostIt from "@/components/PostIt";
import PostModal from "@/components/PostModal";
import { icons, temporaryColors } from "@/constants";
import { Post, PostWithPosition, Position } from "@/types/type";
import { SignedIn } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import { AlgorithmRandomPosition, cleanStoredPosition } from "@/lib/utils";
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
import { GeographicalMode } from "@/types/type";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects";

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
  onDragEnd?: () => void;
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
  onDragEnd,
}) => {
  const position = useRef(new Animated.ValueXY()).current;
  const clickThreshold = 2;
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fontColor, setFontColor] = useState<string>("#0000ff");
  const { stacks, setStacks, soundEffectsEnabled } = useGlobalContext();
  const { playSoundEffect } = useSoundEffects(); // Get sound function
  const [newPosition, setNewPosition] = useState<MappingPostitProps | null>(null);
  const [isPinned, setIsPinned] = useState<boolean>(post.pinned);
  const [wasStacked, setWasStacked] = useState<boolean>(false); // Track if stacking occurred during dragging

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
        } else {
          // Call the onDragEnd callback immediately to play the stacking sound
          if (onDragEnd) {
            // No delay - call immediately
            onDragEnd();
          }
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
            className="text-[14px] font-[500] text-black"
            style={{
              color: fontColor,
              padding: 18,
              fontStyle: "italic",
            }}
            numberOfLines={5}
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
  mode?: GeographicalMode;
}

const PostItBoard: React.FC<PostItBoardProps> = ({
  userId,
  handlePostsRefresh,
  handleNewPostFetch,
  handleUpdatePin,
  showPostItText = false,
  invertColors = false,
  mode = "world",
}) => {
  const [mapType, setMapType] = useState<string>("satellite");
  const [isUserInfoModalVisible, setIsUserInfoModalVisible] = useState(false);
  const [postsWithPosition, setPostsWithPosition] = useState<
    PostWithPosition[]
  >([]);
  const { isIpad, stacks, setStacks, soundEffectsEnabled } = useGlobalContext();
  const { playSoundEffect } = useSoundEffects(); // Get sound function
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostWithPosition | null>(
    null
  );
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [maps, setMap] = useState<MappingPostitProps[]>([]);
  const lastStackedPostIdRef = useRef<number | null>(null);
  const isUserDragging = useRef(false);
  const pendingStackSound = useRef(false);

  if (!userId) {
    return null;
  }

  const screenHeight = Dimensions.get("screen").height;
  const screenWidth = Dimensions.get("screen").width;

 const AlgorithmNewPosition = (isPinned: boolean) => {

    if (isPinned) {
      return {top: 60 + Math.random() * 10, left: 40 + Math.random() * 10 }
    } else if (isIpad) {
      const top = ((Math.random() - 0.5) * 2) * screenHeight / 3 + screenHeight / 4;
      const left = ((Math.random() - 0.5) * 2) * screenWidth / 3 + screenWidth - screenWidth / 1.75
      return {
        top:  top,
        left: left
      }
    }
     else {
      const top = ((Math.random() - 0.5) * 2) * screenHeight / 4 + screenHeight / 4;
      const left = ((Math.random() - 0.5) * 2) * screenWidth / 4 + screenWidth / 4
      return {
        top:  top,
        left: left
      }
    }
}

  const fetchRandomPosts = async () => {
    setLoading(true);
    try {
      const posts: Post[] = await handlePostsRefresh();
      // set positions of posts

      const postsWithPositions: Array<Post & { position: Position }> = [];
      // pick some "seed" position for the very first post
      let prevPosition: Position = { top: 0, left: 0 };

      for (const post of posts) {
        // compute new position based on the last one
        const position = AlgorithmRandomPosition(post.pinned, prevPosition);
        postsWithPositions.push({ ...post, position });
        // "remember" it for the next iteration
        prevPosition = position;
      }

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
    } finally {
      setLoading(false);

      cleanStoredPosition();
    }
  };

  const updateStacks = (
    postId: number,
    newCoordinates: { x_coordinate: number; y_coordinate: number }
  ) => {
    let updatedStacks = [...stacks];
    let postsToCombine = [postId]; // Set of post IDs to combine into a single stack
    let newlyStackedCount = 0; // Count of newly stacked posts
    let wasNewlyStacked = false; // Flag to track if new stacking occurred
  
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
    
    // Check if the moving post was already in a stack with any of these posts
    const wasAlreadyStacked = updatedStacks.some(stack => 
      stack.ids.includes(postId) && 
      stack.ids.some(id => postsToCombine.includes(id) && id !== postId)
    );
  
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
      
      // This is a newly formed stack, track it
      if (!wasAlreadyStacked) {
        newlyStackedCount = 1;
        wasNewlyStacked = true;
      }
    } else if (affectedStacks.length > 0) {
      // Merge all affected stacks and postsToCombine into one stack
      const mergedStackIds = new Set();
      
      // Track existing stacked IDs before adding the new one
      const existingStackedIds = new Set();
      affectedStacks.forEach((stack) => {
        stack.ids.forEach((id: number) => {
          existingStackedIds.add(id);
          mergedStackIds.add(id);
        });
      });
  
      // Add the moving post ID
      mergedStackIds.add(postId);
      
      // Add any other valid posts that weren't already in stacks
      validPosts.forEach((post) => {
        if (post.id !== postId) {
          mergedStackIds.add(post.id);
          // If this post wasn't already in one of the affected stacks, count it as newly stacked
          if (!existingStackedIds.has(post.id)) {
            newlyStackedCount++;
          }
        }
      });
      
      // If the postId wasn't already stacked with these posts, count it as newly stacked
      if (!wasAlreadyStacked && existingStackedIds.size > 0) {
        newlyStackedCount++;
        wasNewlyStacked = true;
      }
  
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
    
    // Return whether new stacking occurred (instead of playing sound here)
    return wasNewlyStacked;
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
    
    // Check if this post will likely stack with others
    // This is to help detect stacking early, before React state updates
    let willLikelyStack = false;
    maps.forEach((mappedPost) => {
      if (mappedPost.id !== id) {
        const dist = distanceBetweenPosts(
          x,
          y,
          mappedPost.coordinates.x_coordinate,
          mappedPost.coordinates.y_coordinate
        );
        
        if (dist <= 15) {
          // Posts are close enough that they'll likely stack
          willLikelyStack = true;
        }
      }
    });
    
    // If we detect likely stacking, prepare for sound
    if (willLikelyStack) {
      pendingStackSound.current = true;
      lastStackedPostIdRef.current = id;
    }
    
    // Update map immediately
    setMap((prevMap) => [
      ...prevMap.filter((p) => p.id !== id),
      postItCoordinates,
    ]);
    
    // Update stacks immediately instead of with a delay
    const newPostScreenCoordinates = { x_coordinate: x, y_coordinate: y };
    const wasNewlyStacked = updateStacks(id, newPostScreenCoordinates);
    
    // If a note was newly stacked, set the pending stack sound flag
    if (wasNewlyStacked) {
      pendingStackSound.current = true;
      lastStackedPostIdRef.current = id;
    }
  };

  const reorderPost = (topPost: PostWithPosition) => {
    // Flag to track when a user starts dragging
    isUserDragging.current = true;
    
    setPostsWithPosition((prevPosts: PostWithPosition[]) => [
      ...prevPosts.filter((post) => post.id !== topPost.id), // Remove the moved post
      topPost, // Add the moved post to the end
    ]);
  };

  // Add a direct test function for sounds
  const testPlaySound = (soundType: SoundType) => {
    try {
      // Try to play the sound directly - bypass the soundEffectsEnabled check for testing
      playSoundEffect(soundType);
    } catch (error) {
      // Error silently handled
    }
  };
  
  // Update manual stacking function to use the direct test
  const handleGatherPosts = () => {
    if (maps.length > 0 && postsWithPosition.length > 1) {
      // Get reference coordinates (where to gather all posts)
      const ref = maps[maps.length - 1].coordinates;
      
      // Create new positions for all posts at the same location
      const newPostsPositions = postsWithPosition.map((post) => ({
        id: post.id,
        coordinates: {
          x_coordinate: ref.x_coordinate,
          y_coordinate: ref.y_coordinate,
        },
      }));
      
      // Update the map with the new positions
      setMap(newPostsPositions);
      
      // Immediately play a sound for manual gathering - no delay
      testPlaySound(SoundType.Stack);
      
      // Still delay the success sound a bit
      setTimeout(() => {
        testPlaySound(SoundType.Success);
      }, 300);
    }
  };

  // Update drag end handler to use direct sound testing
  const handleDragEnd = (postId: number) => {
    isUserDragging.current = false;
    
    // If there's a pending stack sound and the post that was stacked is being released
    // Or if it's the same post ID that was stacked
    if (pendingStackSound.current && (lastStackedPostIdRef.current === postId || lastStackedPostIdRef.current === null)) {
      pendingStackSound.current = false;
      
      // Play sound directly
      testPlaySound(SoundType.Stack);
    }
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

  const forceStack = (id: number) => {
    // Find the post in the maps array
    const post = maps.find((p) => p.id == id);
    
    // If not found, return a default position to avoid undefined
    if (!post) {
      // Return a default position if the post isn't found
      return {
        id: id,
        coordinates: {
          x_coordinate: 0,
          y_coordinate: 0,
        }
      };
    }
    
    return post;
  };

  // Add a test function to check if sound effects work
  useEffect(() => {
    // Test sound effect on component mount
    if (soundEffectsEnabled) {
      setTimeout(() => {
        try {
          console.log("Testing sound effects system...");
          playSoundEffect(SoundType.Stack);
          console.log("Sound effect test successful");
        } catch (error) {
          console.error("Sound effect test failed:", error);
        }
      }, 1000);
    }
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


  const handleIsPinned = (isPinned: boolean) => {
    setIsPinned(isPinned)
    const existingPostIds = postsWithPosition.map((post) => post.id);
    handleUpdatePin(existingPostIds)
  }

  const handleCloseModal = async () => {
    if (selectedPost && !isPinned) {
      const postId = selectedPost.id;
      setSelectedPost(null);

      
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

      const existingPostIds = postsWithPosition.map((post) => post.id);

      const newPost = await handleNewPostFetch(existingPostIds);

      if (newPost && !existingPostIds.includes(newPost.id)) {
        const newPostWithPosition: PostWithPosition = {
          ...newPost,
          position: {
            top: AlgorithmNewPosition(newPost.pinned).top,
            left: AlgorithmNewPosition(newPost.pinned).left
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
                    <ActivityIndicator size="small" color="#888888" />
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
                      onDragEnd={() => handleDragEnd(post.id)}
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

import { useStacks } from "@/app/contexts/StacksContext";
import DraggablePostIt from "./DraggablePostIt";
import PostModal from "@/components/PostModal";
import { Post, PostWithPosition, Stacks, PostItBoardProps, UserNicknamePair } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import { 
  calculateBoardDimensions,
  getAllPositions
} from "@/lib/algorithms/position";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  View,
  Text,
} from "react-native";
import { GeographicalMode, MappingPostitProps } from "@/types/type";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects";
import ColoreActivityIndicator from "./ColoreActivityIndicator";
import React, { useEffect, useRef, useState } from "react";
import { mappingPostIt, reorderPost } from '@/lib/postItBoard';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeOut, FadeIn, Easing } from 'react-native-reanimated';
import StackCircle from "./StackCircle";
import ModalSheet from "./Modal";
import RenameContainer from "./RenameContainer";
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { updateStacks } from "@/lib/stack";
import ScrollMap from "./ScrollMap";
import { allColors } from "@/constants";
import { distanceBetweenPosts } from "@/lib/post";
import KeyboardOverlay from "./KeyboardOverlay";
import { FindUser } from "./FindUsers";
import { useAlert } from "@/notifications/AlertContext";

const screenHeight = Dimensions.get("screen").height;
const screenWidth = Dimensions.get("screen").width;
const screenDimensions = {width: screenWidth, height: screenHeight };
const COLOR_HEIGHT_TRIGGER = 80;
const LOADING_TIMEOUT = 10000; // 10 seconds timeout for loading

const PostItBoard: React.FC<PostItBoardProps> = ({
  userId,
  handlePostsRefresh,
  handleNewPostFetch,
  handleUpdatePin,
  showPostItText = false,
  invertColors = false,
  mode = "world",
  isEditable = true,
  randomPostion = true,
}) => {
const { user } = useUser();

// 🗺️ Map and Zoom State
const [mapType, setMapType] = useState("satellite"); // Map display type (e.g., satellite, standard)
const [zoomScale, setZoomScale] = useState(1); // Current zoom scale level
const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 }); // Scroll offset to track map movement
const offsetY = useSharedValue(0); // Shared vertical scroll offset (Reanimated)
const [showMap, setShowMap] = useState<boolean>(false); // Shows the map with the markers
const scrollTimeout = useRef<NodeJS.Timeout | null>(null); // Time it takes for map to disappear after end of scrolling behaviour
const previousOffset = useRef({ x: 0, y: 0 }); // Store previous scrollOffset

// 📍 Post Data and Selection
const [postsWithPosition, setPostsWithPosition] = useState<Post[]>([]); // All posts with a board position
const [standalonePosts, setStandalonePosts] = useState<Post[]>([]); // Posts that aren't in a stack
const [selectedPosts, setSelectedPosts] = useState<Post[] | null>(null); // Posts currently selected by user
const [excludeIds, setExcludeIds] = useState<string[]>([]); // Post IDs to exclude from render or logic
const [selectedModal, setSelectedModal] = useState<any>(null); // Currently open modal (e.g., post preview)
const [selectedTitle, setSelectedTitle] = useState<string | null>(null); // Optional selected post title
const [allPostsInStack, setAllPostsInStack] = useState<Post[]>([]); // All posts currently grouped in a stack

// 🗃️ Stack and Mapping State
const [enableStacking, setEnableStacking] = useState(false); // Toggle to allow posts to stack together
const [isPinned, setIsPinned] = useState(false); // Whether current board view is pinned in place
const [forceMoveMap, setForceMoveMap] = useState<{ [postId: number]: { dx: number, dy: number } }>({}); // Forces position offset for individual posts
const [maps, setMap] = useState<MappingPostitProps[]>([]); // Rendered postit mapping information
const [isStackMoving, setIsStackMoving] = useState(false); // If a stack is currently being dragged
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [currentStack, setCurrentStack] = useState<Stacks>();
  const [isPanningMode, setIsPanningMode] = useState(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const pendingStackSound = useRef(false);

  const { stacks, setStacks } = useStacks();
  const { showAlert } = useAlert()
  const stackUpdating = useRef(false)
  const { playSoundEffect } = useSoundEffects();

  const scrollViewRef = useRef<ScrollView>(null);
  const innerScrollViewRef = useRef<ScrollView>(null);
  const [refreshing, setRefreshing] = useState(false);


  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const lastScale = useSharedValue(1); // Track last scale value

  // First, declare a shared value for initial position
  const initialPositionX = useSharedValue(screenWidth);
  const initialPositionY = useSharedValue(screenHeight/2);

  // Update the pan gesture
  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => {
      // Ensure we start from current position
      translateX.value = 0;
      translateY.value = 0;
    })
    .onUpdate((event) => {
      if (!isPanningMode) return;
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (!isPanningMode) return;
      
      // Update final position immediately to avoid rubber band
      initialPositionX.value += event.translationX / scale.value;
      initialPositionY.value += event.translationY / scale.value;
      
      // Update scroll offset for other components to use
      setScrollOffset({
        x: initialPositionX.value,
        y: initialPositionY.value
      });
      
      // Reset translation immediately without animation to prevent rubber band
      translateX.value = 0;
      translateY.value = 0;
    });

  const pinchGesture = Gesture.Pinch()
    .runOnJS(true)
    .onBegin(() => {
      if (!isPanningMode) return;
      // Save the current scale as our reference
      lastScale.value = scale.value;
    })
    .onUpdate((event) => {
      if (!isPanningMode) return;
      // Calculate new scale based on lastScale and current gesture
      const newScale = Math.max(0.6, Math.min(lastScale.value * event.scale, 1.2));
      scale.value = newScale;
      setZoomScale(newScale);
    })
    .onEnd(() => {
      if (!isPanningMode) return;
      // Store the final scale for the next gesture
      lastScale.value = scale.value;
    });

  // Add double tap to reset zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .runOnJS(true)
    .onEnd(() => {
      if (!isPanningMode) return;
      // Reset zoom to 1 with smooth animation
      scale.value = withTiming(1, { duration: 250, easing: Easing.ease });
      lastScale.value = 1;
      setZoomScale(1);
    });

  const combinedGestures = Gesture.Simultaneous(
    Gesture.Exclusive(doubleTapGesture, panGesture),
    pinchGesture
  );



  if (!userId) {
    return null;
  }

  // --- STYLING FUNCTION ---
  
  const animatedStyle = useAnimatedStyle(() => ({
    height: withTiming(Math.abs(offsetY.value), { duration: 100 }),
    opacity: withTiming(Math.min(Math.abs(offsetY.value) / COLOR_HEIGHT_TRIGGER, 1)),
  }));

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { x, y } = event.nativeEvent.contentOffset;
    setScrollOffset({ x, y });
    offsetY.value = Math.min(y, 0);
  };


  const fetchRandomPosts = async () => {
    setLoading(true);
    setEnableStacking(false);
    try {
      console.log("Fetching posts...");
      const posts: Post[] = await handlePostsRefresh();
      console.log("Posts fetched:", posts?.length || 0);

      // Calculate board dimensions based on post count
      const boardDimensions = calculateBoardDimensions(posts.length, screenDimensions);


      let postsWithPositions: Array<Post> = [];

      // Only use manual positioning if randomPosition is false
      if (!randomPostion && posts.some(post => post.position?.top !== 0 || post.position?.left !== 0)) {
        // Use existing positions
        for (const post of posts) {
          const positionWithOffset = {
            top: Number(post.position?.top ?? 0) - scrollOffset.y,
            left: Number(post.position?.left ?? 0) - scrollOffset.x,
            rotate: `${Math.abs(Math.random() * 8)}deg`,
          };
          postsWithPositions.push({ ...post, position: positionWithOffset });
        }
      } else {
        // Use optimized positioning algorithm for better layout
        const optimizedPosition = getAllPositions(posts.length, boardDimensions);
        console.log("board dimension: ", boardDimensions, "optimized position: ", optimizedPosition.length)

        for (const pos of optimizedPosition) {
          const index = optimizedPosition.indexOf(pos)
          const post = posts[index]
          const iniX = pos.left ?? 0;
          const iniY = pos.top ?? 0;

          
          const positionWithOffset = {
            ...post.position,
            left: iniX,
            top: iniY,
          };
          
          postsWithPositions.push({ ...posts[index], position: positionWithOffset });
          

          // Update position in backend if needed
        if (!randomPostion && (post.position.top === 0 && post.position.left === 0)) {
            await fetchAPI(`/api/posts/updatePostPosition`, {
              method: "PATCH",
              body: JSON.stringify({
                postId: post.id,
                top: post.position.top,
                left: post.position.left
              }),
            });
          }
        }
      }

      // Initialize each post as a stack
      setStacks((prevStack) => prevStack.filter((stack) => stacks));
      setPostsWithPosition(postsWithPositions);
      setStandalonePosts(postsWithPositions);
      
      // Initialize to add to map
      const initialMap = postsWithPositions.map((post: Post) =>
        mappingPostIt({
          id: post.id,
          coordinates: { 
            x_coordinate: post.position?.left ?? 0,
            y_coordinate: post.position?.top ?? 0,
          },
        })
      );
      
      setMap(initialMap);
      setEnableStacking(true);
      console.log("Posts processed, count:", postsWithPositions.length);
    } catch (error) {
      console.error("Failed to fetch posts with error:", error);
      setError("Failed to fetch new posts.");
    } finally {
      setLoading(false);

    }
  };

  // --- HANDLER FUNCTIONS ---

  const handleRenameStack = (stack: Stacks) => {
    setCurrentStack(stack)
    setKeyboardVisible(true)
  };

  const updatePostPosition = async (
    dx: number,
    dy: number,
    post: Post
  ) => {
    const id = post.id;
    const postItCoordinates = mappingPostIt({
      id,
      coordinates: { x_coordinate: dx, y_coordinate: dy },
    });

    setMap((prevMap) => [
      ...prevMap.filter((p) => p.id !== id),
      postItCoordinates,
    ]);
  };

  const handleReorderPost = (post: Post) => {
    const sorted = reorderPost(postsWithPosition, post);
    setPostsWithPosition(sorted);
  };

  const handleStackPosition = (
    newX: number,
    newY: number,
    stack: Stacks
  ) => {
    stackUpdating.current = true;
    setStacks((prevStacks) =>
      prevStacks.map((s) =>
        s.name === stack.name
          ? { ...s, center: { x: newX, y: newY } }
          : s
      )
    );
    stackUpdating.current = false;
    setIsPanningMode(true);
  };

 const handleShareStack = async (friend: UserNicknamePair, localStack: Stacks) => {

  try {
    if (!localStack) return;
    
    // Wait for stack creation
    const newlyCreatedStackResponse = await fetchAPI(`/api/stacks/newStack`, {
      method: "POST",
      body: JSON.stringify({
        name: localStack.name,
        centerX: localStack.center.x,
        centerY: localStack.center.y,
        ids: localStack.ids,
        boardId: -1,
        userId: user!.id
      })
    });
    console.log("[handleShareStack]: ", newlyCreatedStackResponse.data)
    // Ensure stack was created successfully
    if (!newlyCreatedStackResponse?.data) {
      throw new Error("Failed to create stack");
    }

    const newlyCreatedStack = newlyCreatedStackResponse.data;
    const friendId = friend[0];


    // Now share the stack (this will wait for the above to complete)
    const response = await fetchAPI(`/api/shared/newSharedStack`, {
      method: "POST",
      body: JSON.stringify({
        stackId: newlyCreatedStack.id, // Remove optional chaining since we validated above
        sharedById: userId,
        sharedToId: friendId,
        boardId: -2,
        message: ""
      }),
    });

    // Ensure sharing was successful
    if (!response?.data) {
      throw new Error("Failed to share stack");
    }

    const { username } = response.data;
    const status = response.success
    const warning = response.warning

    if (status) {
    showAlert({
      title: 'Shared!',
      message: `This stack was shared to ${username}`,
      type: 'SUCCESS',
      status: 'success',
    });}
    else if (status && warning) {
       showAlert({
      title: 'Warning',
      message: "warning",
      type: 'ERROR',
      status: 'error',
    });}
    

  } catch (err) {
    console.error("Failed to share stack: ", err);
    showAlert({
      title: 'Error',
      message: "Unable to share this stack.",
      type: 'ERROR',
      status: 'error',
    });
  } finally {
    setSelectedModal(null);
    setSelectedTitle("");
  }
}

  const handleIsPinned = (isPinned: boolean) => {
    setIsPinned(isPinned);
    const existingPostIds = postsWithPosition.map((post) => post.id);
    handleUpdatePin(existingPostIds);
  };

  const handleCloseModal = () => {
    setTimeout(() => {
          setSelectedPosts(null);
    }, 500)
        setIsPanningMode(true);
  };

  const handleOuterLayout = () => {
    scrollViewRef.current?.scrollTo({
      x: postsWithPosition[0].position.left ?? screenWidth / 2,
      animated: true,
    });
  };

  const handleInnerLayout = () => {
    innerScrollViewRef.current?.scrollTo({
      y: postsWithPosition[0].position.top ?? screenHeight / 2,
      animated: true,
    });
  };

  const handlePostPress = async (post: PostWithPosition) => {
    const stack = stacks.find((stack) => stack.ids.includes(post.id));
    if (stack) {
      setSelectedPosts(stack.elements);
      setExcludeIds((prev) => [...prev, ...stack.ids]);
    } else {
      setSelectedPosts([post]);
      setExcludeIds((prev) => [...prev, String(post.id)]);
    }

    if (post.unread) {
      try {
        await fetchAPI(`/api/notifications/updateUnreadPosts`, {
          method: "PATCH",
          body: JSON.stringify({ postId: post.id }),
        });
      } catch (error) {
        console.error("Failed to update unread message:", error);
      }
    }

    setIsPinned(post.pinned);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((res) => setTimeout(res, 1500));
    setRefreshing(false);
  };

  // --- EFFECTS ---

useEffect(() => {
  // If the offset has changed, show the map
  if (
    scrollOffset.x !== previousOffset.current.x ||
    scrollOffset.y !== previousOffset.current.y
  ) {
    setShowMap(true);
    previousOffset.current = scrollOffset;

    // Clear any previous timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    // Set a timeout to hide map after 2.5s of no movement
    scrollTimeout.current = setTimeout(() => {
      setShowMap(false);
    }, 800);
  }
}, [scrollOffset]);

  useEffect(() => {
    if (maps.length > 1 && enableStacking && !stackUpdating.current) {
      const last = maps[maps.length - 1];
      updateStacks(
        last.id,
        last.coordinates,
        postsWithPosition,
        stacks,
        setStacks,
        setAllPostsInStack,
        maps
      );
    }
  }, [maps]);

  useEffect(() => {
    fetchRandomPosts();
  }, [mode]);

  // Add a useEffect for loading timeout
  /* useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (loading) {
      console.log("Starting loading timeout");
      timeoutId = setTimeout(() => {
        console.log("Loading timeout reached, forcing state update");
        setLoading(false);
        if (postsWithPosition.length === 0) {
          setError("Loading timed out. Please try refreshing.");
        }
      }, LOADING_TIMEOUT);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading]);

  // Modify the rendering logic to prevent infinite loading
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ColoreActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Error: {error}</Text>
      </View>
    );
  } */

  if (postsWithPosition.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg text-gray-600">No posts available</Text>
        <ColoreActivityIndicator />
      </View>
    );
  }


  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <Animated.View
        style={[
          {
            position: 'relative',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#fafafa',
            zIndex: 10,
          },
          animatedStyle,
        ]}
      />

      <SignedIn>
      {!!showMap && 
        <ScrollMap 
          scrollOffset={{
            x: scrollOffset.x,
            y: scrollOffset.y
          }}
          
          scrollableDimensions={{
            width: calculateBoardDimensions(postsWithPosition.length, screenDimensions).width,
            height: calculateBoardDimensions(postsWithPosition.length, screenDimensions).height
          }} 
          posts={postsWithPosition}
          indicator={{
            color: '#FFC757',
            size: 12
          }}
          />}
        {error ? (
          <View className="flex-1 items-center justify-center">
            <ColoreActivityIndicator />
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            onLayout={handleOuterLayout}
            style={{ flex: 1 }}
            decelerationRate={0.9}
            maximumZoomScale={1.2}
            minimumZoomScale={0.6}
            contentContainerStyle={{
              width: calculateBoardDimensions(postsWithPosition.length, screenDimensions).width + screenDimensions.width + 150,
              height: calculateBoardDimensions(postsWithPosition.length, screenDimensions).height + screenDimensions.height
            }}
            scrollEnabled={isPanningMode}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="transparent"
                colors={['transparent']}
                progressBackgroundColor="transparent"
              />
            }
            horizontal
            nestedScrollEnabled
          >
            <ScrollView
              ref={innerScrollViewRef}
              onLayout={handleInnerLayout}
              nestedScrollEnabled
              scrollEnabled={isPanningMode}
              contentContainerStyle={{
              width: calculateBoardDimensions(postsWithPosition.length, screenDimensions).width + screenDimensions.width + 150,
              height: calculateBoardDimensions(postsWithPosition.length, screenDimensions).height + screenDimensions.height
              }}
            >
              <View className="flex-1 w-full h-full relative">
              

                  {/* Render stack circles */}
                  {stacks.map((stack) => {
                    const hasPosts = postsWithPosition.some((p) =>
                      stack.ids.includes(p.id)
                    );
                    if (!hasPosts) return null;
                    return (
                      <StackCircle
                        key={stack.name}
                        stack={stack}
                        scrollOffset={scrollOffset}
                        isEditable={isEditable}
                        onViewPress={() => setSelectedPosts(stack.elements)}
                        onEditPress={() => isEditable && handleRenameStack(stack)}
                        onSendPress={() => {
                          setSelectedModal(
                            <View className="flex-1 mx-6">
                            <FindUser selectedUserInfo={(user) => handleShareStack(user, stack)}                            />
                              </View>
                          )
                          setSelectedTitle("Sharing with?")
                        }}
                        enabledPan={() => setIsPanningMode((prev) => !prev)}
                        stackMoving={() => setIsStackMoving((prev) => !prev)}
                        updateStackPosition={handleStackPosition}
                      />
                    );
                  })}

                  {/* Render standalone posts */}
                  {postsWithPosition.map((post) => {
                    if (allPostsInStack.includes(post)) return null;
                    return (
                      <DraggablePostIt
                        key={post.id}
                        post={post}
                        position={{
                          top: post.position.top,
                          left: post.position.left,
                        }}
                        updateIndex={() => handleReorderPost(post)}
                        updatePosition={(dx, dy) =>
                          updatePostPosition(dx, dy, post)
                        }
                        onPress={() => handlePostPress(post)}
                        showText={showPostItText}
                        isViewed={excludeIds.includes(String(post.id))}
                        enabledPan={() => setIsPanningMode((prev) => !prev)}
                        zoomScale={zoomScale}
                        scrollOffset={scrollOffset}
                        disabled={isStackMoving}
                        visibility={isStackMoving ? 0.5 : 1}
                      />
                    );
                  })}
              </View>
          
          {!!selectedPosts && (
            <PostModal
              isVisible={!!selectedPosts}
              selectedPosts={selectedPosts}
              handleCloseModal={handleCloseModal}
              handleUpdate={(isPinned: boolean) => handleIsPinned(isPinned)}
              invertedColors={invertColors}
            />
          )}
          
          {!!selectedModal && (
            <ModalSheet
              isVisible={!!selectedModal}
              title={selectedTitle}
              onClose={() => {
                setSelectedModal(null);
                setSelectedTitle(null);
              }}                
            >
              {selectedModal}
            </ModalSheet>
          )}
      )}
        </ScrollView>
        </ScrollView>)}
  </SignedIn>
</View>)
    }

    export default PostItBoard;
        
        
      
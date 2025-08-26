import { useStacks } from "@/app/contexts/StacksContext";
import DraggablePostIt from "./DraggablePostIt";
import PostModal from "@/components/PostModal";
import { Post, PostWithPosition, Stacks, PostItBoardProps, UserNicknamePair } from "@/types/type";
import { SignedIn } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import { 
  calculateBoardDimensions,
  getAllPositions,
  POSTIT_HEIGHT,
  POSTIT_WIDTH
} from "@/lib/algorithms/position";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import ColoreActivityIndicator from "./ColoreActivityIndicator";
import React, { useEffect, useRef, useState } from "react";
import { mappingPostIt, reorderPost } from '@/lib/postItBoard';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedScrollHandler
} from 'react-native-reanimated';
import StackCircle from "./StackCircle";
import ModalSheet from "./Modal";
import { 
  Gesture, 
  GestureDetector,
  PanGestureHandler,
  State,
  GestureHandlerRootView
} from 'react-native-gesture-handler';
import { updateStacks } from "@/lib/stack";
import ScrollMap from "./ScrollMap";
import { FindUser } from "./FindUsers";
import { useAlert } from "@/notifications/AlertContext";
import EmptyListView from "./EmptyList";

const screenDimensions = {
  width: Dimensions.get("screen").width,
  height: Dimensions.get("screen").height
};

const PostItBoard: React.FC<PostItBoardProps> = ({
  userId,
  handlePostsRefresh,
  handleUpdatePin,
  showPostItText = false,
  invertColors = false,
  mode = "world",
  isEditable = true,
  randomPostion = true,
  allowedComments = true
}) => {
  // Core state
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<Post[] | null>(null);
  const [selectedModal, setSelectedModal] = useState<any>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Map and interaction state
  const [zoomScale, setZoomScale] = useState(1);
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const [showMap, setShowMap] = useState(false);
  const [isPanningMode, setIsPanningMode] = useState(true);
  const [isStackMoving, setIsStackMoving] = useState(false);
  const [isPostItDragging, setIsPostItDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(0);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const previousOffset = useRef({ x: 0, y: 0 });

  // Shared values for animations
  const offsetY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const lastScale = useRef(1);

  // Context and hooks
  const { stacks, setStacks } = useStacks();
  const { showAlert } = useAlert();
  const stackUpdating = useRef(false);

  // Animated styles - MUST be before any early returns
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ]
  }));

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    height: withTiming(Math.abs(offsetY.value), { duration: 100 }),
    opacity: withTiming(Math.min(Math.abs(offsetY.value) / 80, 1)),
  }));

    const pan = Gesture.Pan()
    .enabled(isPanningMode && !isPostItDragging)
    .runOnJS(true)
    .onUpdate(e => {
      // (optional) if you actually want board panning via transform:
      // translateX.value += e.changeX;
      // translateY.value += e.changeY;
      // runOnJS(setScrollOffset)({ x: translateX.value, y: translateY.value });
    });
  
  const pinch = Gesture.Pinch()
    .enabled(isPanningMode && !isPostItDragging)
    .runOnJS(true)
    .onUpdate(e => {
      const next = Math.max(0.6, Math.min(lastScale.current * e.scale, 1.2));
      scale.value = next;
      runOnJS(setZoomScale)(next);
    })
    .onEnd(() => { lastScale.current = scale.value; });
  
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .enabled(isPanningMode && !isPostItDragging)
    .runOnJS(true)
    .onEnd(() => {
      scale.value = withTiming(1, { duration: 250, easing: Easing.ease });
      lastScale.current = 1;
      translateX.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(0, { duration: 250 });
      runOnJS(setScrollOffset)({ x: 0, y: 0 });
    });
  
  const combinedGestures = Gesture.Simultaneous(
    Gesture.Exclusive(doubleTap, pan),
    pinch
  );
  

  // Effects - MUST be before any early returns
  useEffect(() => {
    if (scrollOffset.x !== previousOffset.current.x || scrollOffset.y !== previousOffset.current.y) {
      setShowMap(true);
      previousOffset.current = scrollOffset;

      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => setShowMap(false), 800);
    }
  }, [scrollOffset]);

  useEffect(() => {
    fetchPosts();
  }, [mode]);


  useEffect(() => {

    if (isPostItDragging) {
      setIsPanningMode(false)
    } else {
      setIsPanningMode(true)
    }

  }, [isPostItDragging])

  // Scroll handler - MUST be before any early returns
  const scrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { x, y } = event.nativeEvent.contentOffset;
    setScrollOffset({ x, y });
    offsetY.value = Math.min(y, 0);
  };

  // Simplified post positioning
  const positionPosts = (posts: Post[]) => {
    const boardDimensions = calculateBoardDimensions(posts.length, screenDimensions);
    
    if (!randomPostion && posts.some(post => post.position?.top !== 0 || post.position?.left !== 0)) {
      return posts.map(post => {
        let top = Number(post.position?.top ?? 0);
        let left = Number(post.position?.left ?? 0);
        
        // Ensure within bounds
        if (top <= 0 || left <= 0 || 
            top > boardDimensions.height - POSTIT_HEIGHT || 
            left > boardDimensions.width - POSTIT_WIDTH || (top <= POSTIT_HEIGHT && left <= POSTIT_WIDTH)) {
          top = Math.random() * (boardDimensions.height - POSTIT_HEIGHT) + POSTIT_HEIGHT/2 ;
          left = Math.random() * (boardDimensions.width - POSTIT_WIDTH) + POSTIT_WIDTH/2;
          
          // Update backend
          fetchAPI(`/api/posts/updatePostPosition`, {
            method: "PATCH",
            body: JSON.stringify({ postId: post.id, top, left }),
          });
        }
        
        return { ...post, position: { top, left } };
      });
    } else {
      const positions = getAllPositions(posts.length, boardDimensions);
      return posts.map((post, index) => {
        const pos = positions[index];
        let top = pos.top ?? 0;
        let left = pos.left ?? 0;
        
        // Ensure within bounds
        if (top < 0 || left < 0 || 
            top > boardDimensions.height - POSTIT_HEIGHT || 
            left > boardDimensions.width - POSTIT_WIDTH) {
          top = Math.random() * (boardDimensions.height - POSTIT_HEIGHT);
          left = Math.random() * (boardDimensions.width - POSTIT_WIDTH);
          
          fetchAPI(`/api/posts/updatePostPosition`, {
            method: "PATCH",
            body: JSON.stringify({ postId: post.id, top, left }),
          });
        }
        
        return { ...post, position: { top, left } };
      });
    }
  };

  // Simplified post fetching
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const fetchedPosts = await handlePostsRefresh();
      const positionedPosts = positionPosts(fetchedPosts);
      
      setPosts(positionedPosts);
      
      // Initialize map
      const initialMap = positionedPosts.map(post => 
        mappingPostIt({
          id: post.id,
          coordinates: { 
            x_coordinate: post.position?.left ?? 0,
            y_coordinate: post.position?.top ?? 0,
          },
        })
      );
      
      // Update stacks
      if (initialMap.length > 1) {
        updateStacks(
          initialMap[initialMap.length - 1].id,
          initialMap[initialMap.length - 1].coordinates,
          positionedPosts,
          stacks,
          setStacks,
          () => {}, // setAllPostsInStack
          initialMap
        );
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setError("Failed to fetch posts.");
    } finally {
      setLoading(false);
    }
  };

  // Simplified handlers
  const handlePostPress = async (post: Post) => {
    const stack = stacks.find(s => s.ids.includes(post.id));
    if (stack) {
      setSelectedPosts(stack.elements);
    } else {
      setSelectedPosts([post]);
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
  };

  const handleShareStack = async (friend: UserNicknamePair, stack: Stacks) => {
    try {
      const stackResponse = await fetchAPI(`/api/stacks/newStack`, {
        method: "POST",
        body: JSON.stringify({
          name: stack.name,
          centerX: stack.center.x,
          centerY: stack.center.y,
          ids: stack.ids,
          boardId: -1,
          userId: userId
        })
      });

      if (!stackResponse?.data) throw new Error("Failed to create stack");

      const shareResponse = await fetchAPI(`/api/shared/newSharedStack`, {
        method: "POST",
        body: JSON.stringify({
          stackId: stackResponse.data.id,
          sharedById: userId,
          sharedToId: friend[0],
          boardId: -1,
          message: ""
        }),
      });

      if (shareResponse?.data) {
        showAlert({
          title: 'Shared!',
          message: `Stack shared to ${shareResponse.data.username}`,
          type: 'SUCCESS',
          status: 'success',
        });
      }
    } catch (err) {
      console.error("Failed to share stack:", err);
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
  };

  const handleCloseModal = () => {
    setTimeout(() => setSelectedPosts(null), 500);
    setIsPanningMode(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  // Early returns - AFTER all hooks
  if (!userId) return null;

  // Loading and empty states
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ColoreActivityIndicator />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View className="flex-1 items-center justify-center -mt-[25%]">
        <EmptyListView mood={2} character="steve" message="No posts available. Should I investigate?" />
      </View>
    );
  }

  // Calculate dimensions
  const boardDimensions = calculateBoardDimensions(posts.length, screenDimensions);
  const contentWidth = boardDimensions.width + screenDimensions.width + 150;
  const contentHeight = boardDimensions.height + screenDimensions.height;

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
          animatedHeaderStyle
        ]}
      />

      <SignedIn>
        {showMap && (
          <ScrollMap 
            scrollOffset={scrollOffset}
            scrollableDimensions={boardDimensions}
            posts={posts}
            zoomScale={zoomScale}
            indicator={{ color: '#FFC757', size: 12 }}
          />
        )}
        
        {error ? (
          <View className="flex-1 items-center justify-center">
            <ColoreActivityIndicator />
          </View>
        ) : (
          <GestureHandlerRootView style={{ flex: 1 }}>
            <GestureDetector gesture={combinedGestures}>
              <Animated.View style={[{ flex: 1 }, animatedContainerStyle]}>
                <ScrollView
                  ref={scrollViewRef}
                  style={{ flex: 1 }}
                  decelerationRate={0.9}
                  maximumZoomScale={1.2}
                  minimumZoomScale={0.6}
                  contentContainerStyle={{ width: contentWidth, height: contentHeight }}
                  scrollEnabled={isPanningMode}
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                  onScroll={scrollHandler}
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
                >

                    {/* Render posts */}
                    {posts.map((post) => (
                      <DraggablePostIt
                        key={post.id}
                        post={{
                          ...post,
                          position: {
                            top: post.position?.top ?? 0,
                            left: post.position?.left ?? 0,
                          }
                        }}
                        position={{
                          top: post.position?.top ?? 0,
                          left: post.position?.left ?? 0,
                        }}
                        updateIndex={() => setPosts(prev => reorderPost(prev, post))}
                        updatePosition={(dx, dy) => {
                          // Update map position
                        }}
                        onPress={() => handlePostPress(post)}
                        showText={showPostItText}
                        isViewed={false}
                        enabledPan={() => setIsPanningMode(prev => !prev)}
                        onDragStart={() => setIsPostItDragging(true)}
                        onDragEnd={() => setIsPostItDragging(false)}
                        zoomScale={zoomScale}
                        scrollOffset={scrollOffset}
                        disabled={isStackMoving}
                        visibility={isStackMoving ? 0.5 : 1}
                      />
                    ))}

                </ScrollView>
              </Animated.View>
            </GestureDetector>
          </GestureHandlerRootView>
        )}

        {/* Modals */}
        {selectedPosts && (
          <PostModal
            isVisible={!!selectedPosts}
            selectedPosts={selectedPosts}
            handleCloseModal={handleCloseModal}
            handleUpdate={(isPinned) => {
              const postIds = posts.map(p => p.id);
              handleUpdatePin(postIds);
            }}
            invertedColors={invertColors}
            allowedComments={allowedComments}
          />
        )}
        
        {selectedModal && (
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
      </SignedIn>
    </View>
  );
};

export default PostItBoard;
        
        
      
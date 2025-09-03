import { useStacksManager } from "@/app/contexts/StacksContext";
import DraggablePostIt from "./DraggablePostIt";
import PostModal from "@/components/PostModal";
import { Post, Stacks, PostItBoardProps, PostWithPosition } from "@/types/type";
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
  Text,
  TouchableOpacity
} from "react-native";
import ColoreActivityIndicator from "./ColoreActivityIndicator";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { mappingPostIt, reorderPost } from '@/lib/postItBoard';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  runOnJS
} from 'react-native-reanimated';
import ModalSheet from "./Modal";
import { 
  Gesture, 
  GestureDetector,
  GestureHandlerRootView
} from 'react-native-gesture-handler';
import { updateStacks } from "@/lib/stack";

import ScrollMap from "./ScrollMap";
import { FindUser } from "./FindUsers";
import { useAlert } from "@/notifications/AlertContext";
import EmptyListView from "./EmptyList";
import { useBackgroundColor, useTextColor } from "@/hooks/useTheme";
import { distanceBetweenPosts } from "@/lib/post";
import KeyboardOverlay from "./KeyboardOverlay";
import RenameContainer from "./RenameContainer";


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
  const { virtualMap, setVirtualMap, trackPostit, stacks, setStacks, onDragStart, onDragEnd } = useStacksManager();
  const stacksRef = useRef(stacks);
  const [selectedPosts, setSelectedPosts] = useState<Post[] | null>(null);
  const [selectedModal, setSelectedModal] = useState<any>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const backgroundColor = useBackgroundColor()
  const [onFocus, setOnFocus] = useState<boolean>(false);
  const [currentStackName, setCurrentStackName] = useState<string>("");
  const textColor = useTextColor();

  // Map and interaction state
  const [zoomScale, setZoomScale] = useState(1);
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const [showMap, setShowMap] = useState(false);
  const [isPanningMode, setIsPanningMode] = useState(true);
  const [isPostItDragging, setIsPostItDragging] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollTimeout = useRef<number | null>(null);
  const previousOffset = useRef({ x: 0, y: 0 });

  // Shared values for animations
  const offsetY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const lastScale = useRef(1);


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
          top = Math.random() * (boardDimensions.height - POSTIT_HEIGHT) + POSTIT_HEIGHT / 2 ;
          left = Math.random() * (boardDimensions.width - POSTIT_WIDTH) + POSTIT_WIDTH / 2;
          
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
      setVirtualMap(positionedPosts)
      

    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setError("Failed to fetch posts.");
    } finally {
      setLoading(false);
    }
  };

  // Simplified handlers



  useEffect(() => { 
    stacksRef.current = stacks
    console.log("[POSTITBOARD] stacks updated", stacks)
   }, [stacks]);

  const handlePostPress = useCallback(async (post: Post) => {

    console.log("[HANDLEPOSTPRESS] stacks", stacksRef.current)

    const inStack = stacksRef.current.some((s) => s.ids.includes(post.id));
   
    console.log("[POSTITBOARD] stack found: ", inStack, post.id, stacksRef.current)

    if (inStack) {
      // Find the stack that contains this post
      const stack = stacksRef.current.find(s => s.ids.includes(post.id));
      
      if (stack) {
        // Get all posts that are in this stack
        const elements = virtualMap.filter((p) => stack.ids.includes(p.id));
        setSelectedPosts(elements);
      } else {
        setSelectedPosts([post]);
      }
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
  }, [stacks, posts]);


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
        <ColoreActivityIndicator paddingType="fullPage" />
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
    <View 
    className="flex-1"
    style={{
      backgroundColor: backgroundColor
    }}>
      <Animated.View
        style={[
          {
            position: 'relative',
            top: 0,
            left: 0,
            right: 0,
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
            posts={posts.filter(p => p.position) as PostWithPosition[]}
            zoomScale={zoomScale}
            indicator={{ color: '#FFC757', size: 12 }}
          />
        )}
        
        {error ? (
          <View className="flex-1 items-center justify-center">
            <ColoreActivityIndicator paddingType="fullPage"/>
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
                          trackPostit(post.id, dx, dy);
                          
                          // Sync position with database
                          fetchAPI(`/api/posts/updatePostPosition`, {
                            method: "PATCH",
                            body: JSON.stringify({ postId: post.id, top: dy, left: dx }),
                          }).catch(error => {
                            console.error("Failed to sync post position:", error);
                          });
                        } }
                        onPress={() => {

                          handlePostPress(post)
                        }}
                        showText={showPostItText}
                        isViewed={false}
                        enabledPan={() => setIsPanningMode(prev => !prev)}
                        onDragStart={() => {
                          setIsPostItDragging(true);
                          onDragStart(post.id);
                        } }
                        onDragEnd={() => {
                          onDragEnd(post.id);
                          setIsPostItDragging(false);
     
                        } }
                        zoomScale={zoomScale}
                        scrollOffset={scrollOffset} 
                        disabled={false} 
                        visibility={1}   
                                           />
                    ))}

                    {/* Render Stack */}
                    {stacks.map((stack) => {

                      const firstPostId =  stack.ids[0]
                      const firstPost = virtualMap.find((p) => p.id == firstPostId)

                      let positionX = 0 
                      let positionY = 0

                      if (stack.center) {
                        positionX = stack.center.x
                        positionY = stack.center.y
                      } else {
                        positionX = firstPost?.position?.left ?? 0;
                        positionY = firstPost?.position?.top ?? 0;
                      }
                      
                      return (
                        <TouchableOpacity 
                          activeOpacity={0.8} 
                          onPress={() => {
                            if (stack.name !== undefined) {
                              setCurrentStackName(stack.name);
                            }
                            setOnFocus(true);
                          }}
                          key={stack.id}
                          className="absolute top-0 left-0 z-999 overflow-wrap  self-center items-center"
                          style={{
                            width: 150,
                            minWidth: 150,
                            maxWidth: 150,
                            transform: [
                              { translateX: positionX},
                              { translateY: positionY - 80},
                            ]
                          }}>
                           
                            <Text 
                            className="font-JakartaSemiBold text-2xl text-center self-center"
                            numberOfLines={2}
                            style={{
                              color: textColor
                            }}>
                              {stack.name}
                            </Text>
                          </TouchableOpacity>
                    )
                    })}

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
            title={selectedTitle || undefined}
            onClose={() => {
              setSelectedModal(null);
              setSelectedTitle(null);
            }}                
          >
            {selectedModal}
          </ModalSheet>
        )}

      {onFocus && (
        <KeyboardOverlay onFocus={onFocus} offsetY={scrollOffset.y}>
          <RenameContainer
            onSave={(newName: string) => {
              setStacks((prevStacks) => prevStacks.map((s) => s.name == currentStackName ? {...s, name: newName} : s))
              setOnFocus(false)
            }}
            placeholder={ currentStackName }
            onCancel={() => setOnFocus(false)}
          />
        </KeyboardOverlay>
      )}
      </SignedIn>
    </View>
  );
};

export default PostItBoard;
        
        
      
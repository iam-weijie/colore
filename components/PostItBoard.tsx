import { useGlobalContext } from "@/app/globalcontext";
import DraggablePostIt from "./DraggablePostIt";
import PostModal from "@/components/PostModal";
import { Post, PostWithPosition, Stacks, PostItBoardProps, UserNicknamePair } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import { AlgorithmRandomPosition, cleanStoredPosition } from "@/lib/utils";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { GeographicalMode, MappingPostitProps } from "@/types/type";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects";
import ColoreActivityIndicator from "./ColoreActivityIndicator";
import React, { useEffect, useRef, useState } from "react";
import { mappingPostIt, reorderPost } from '@/lib/postItBoard';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import StackCircle from "./StackCircle";
import ModalSheet from "./Modal";
import RenameContainer from "./RenameContainer";
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { updateStacks } from "@/lib/stack";
import { distanceBetweenPosts } from "@/lib/post";
import KeyboardOverlay from "./KeyboardOverlay";
import { FindUser } from "./FindUsers";
import { useAlert } from "@/notifications/AlertContext";

const screenHeight = Dimensions.get("screen").height;
const screenWidth = Dimensions.get("screen").width;
const COLOR_HEIGHT_TRIGGER = 80;

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

  const { user } = useUser()
  const [mapType, setMapType] = useState("satellite");
  const [postsWithPosition, setPostsWithPosition] = useState<Post[]>([]);
  const [standalonePosts, setStandalonePosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<Post[] | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [currentStack, setCurrentStack] = useState<Stacks>();
  const [excludeIds, setExcludeIds] = useState<string[]>([]);
  const [selectedModal, setSelectedModal] = useState<any>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [enableStacking, setEnableStacking] = useState(false);
  const [forceMoveMap, setForceMoveMap] = useState<{ [postId: number]: { dx: number, dy: number } }>({});
  const [isPinned, setIsPinned] = useState(false);
  const [maps, setMap] = useState<MappingPostitProps[]>([]);
  const [isPanningMode, setIsPanningMode] = useState(true);
  const [isStackMoving, setIsStackMoving] = useState(false);
  const pendingStackSound = useRef(false);
  const [allPostsInStack, setAllPostsInStack] = useState<Post[]>([]);

  const { stacks, setStacks } = useGlobalContext();
  const stackUpdating = useRef(false)
  const { playSoundEffect } = useSoundEffects();

  const scrollViewRef = useRef<ScrollView>(null);
  const innerScrollViewRef = useRef<ScrollView>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const [zoomScale, setZoomScale] = useState(1);
  const offsetY = useSharedValue(0);

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
      const posts: Post[] = await handlePostsRefresh();
      // set positions of posts


      let postsWithPositions: Array<Post> = [];

    
        for (const post of posts) {
          const position = AlgorithmRandomPosition(post.pinned, null, posts.length);
          let newX = 0;
          let newY = 0;

          if (!randomPostion) {
          if (post.position.top == 0 && post.position.left == 0) {
            newX = position.left
            newY = position.top

            await fetchAPI(`/api/posts/updatePostPosition`, {
              method: "PATCH",
              body: JSON.stringify({
                postId: post?.id,
                top: newX, 
                left: newY
              }),
            })
          } else {
            newX = Number(post.position.left)
            newY = Number(post.position.top)
          }
        }


          const iniX = !randomPostion ? (newX) : position?.left ?? 0 + scrollOffset.x;
          const iniY = !randomPostion ? (newY) : position?.top ?? 0 + scrollOffset.y;


          const positionWithOffset = {
            ...position,
            left: iniX,
            top: iniY,
          };
          if (position) {
            postsWithPositions.push({ ...post, position: positionWithOffset });
            
          }
        }
      
      

      // Initialize each post as a stack
      setStacks((prevStack) => prevStack.filter((stack) => stacks))
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
      // console.log(initialMap);
      setMap(initialMap);
      setEnableStacking(true);

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
  
    const post = postsWithPosition.find(p => p.id === postId);
    if (!post) return;
  
    // 1. Remove the post from any stack it was previously in
    updatedStacks = updatedStacks.map(stack => {
      if (stack.ids.includes(postId)) {
        return {
          ...stack,
          ids: stack.ids.filter(id => id !== postId),
          elements: stack.elements.filter(el => el.id !== postId),
        };
      }
      return stack;
    }).filter(stack => stack.ids.length > 0); // Remove empty stacks
  
    // 2. Check if the post should be added to an existing stack
    const insideStackIndex = updatedStacks.findIndex(stack => {
      const dist = distanceBetweenPosts(
        stack.center.x,
        stack.center.y,
        newCoordinates.x_coordinate,
        newCoordinates.y_coordinate
      );
      return dist <= 40;
    });
  
    if (insideStackIndex !== -1) {
      const stack = updatedStacks[insideStackIndex];
  
      // Only add if not already in
      if (!stack.ids.includes(postId)) {
        const updatedStack = {
          ...stack,
          ids: [...stack.ids, postId],
          elements: [...stack.elements, post],
        };
        updatedStacks[insideStackIndex] = updatedStack;
      }
  
      setStacks(updatedStacks);
      return;
    }
  
    // 3. If no existing stack nearby, check if it should form a new stack with nearby posts
    const nearby = maps.filter(m => {
      if (m.id === postId) return false;
      const dist = distanceBetweenPosts(
        newCoordinates.x_coordinate,
        newCoordinates.y_coordinate,
        m.coordinates.x_coordinate,
        m.coordinates.y_coordinate
      );
      return dist <= 40;
    });
  
    if (nearby.length > 0) {
      const nearbyFullPosts = nearby
        .map(m => postsWithPosition.find(p => p.id === m.id))
        .filter((p): p is PostWithPosition => p !== undefined);
  
      const newStack = {
        name: `New Stack ${updatedStacks.length + 1}`,
        ids: [postId, ...nearby.map(m => m.id)],
        elements: [post, ...nearbyFullPosts],
        center: {
          x: newCoordinates.x_coordinate,
          y: newCoordinates.y_coordinate,
        },
      };
  
      updatedStacks.push(newStack);
      setStacks(updatedStacks);
      return;
    }
  
    // 4. Otherwise, the post is alone, not stacked. (You may handle solo-post case here if needed.)
    setStacks(updatedStacks);
  };
  

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

    if (!randomPostion) {
      pendingStackSound.current = true;
      try {
        await fetchAPI(`/api/posts/updatePostPosition`, {
          method: "PATCH",
          body: JSON.stringify({
            postId: post.id,
            top: dy + scrollOffset.y,
            left: dx + scrollOffset.x,
          }),
        });
      } catch (err) {
        console.error("Failed to update post position: ", err);
      }
    }
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
        boardId: -1,
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
      message: warning,
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
    setSelectedPosts(null);
    setIsPanningMode(true);
  };

  useEffect(() => {
    fetchRandomPosts();
  }, []);
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
    fetchRandomPosts();
  }, []);

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





   if (postsWithPosition.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <ColoreActivityIndicator text="Summoning Bob..." />
      </View>
    );
  }



  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <Animated.View
        style={[
          {
            position: 'absolute',
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
        {error ? (
          <View className="flex-1 items-center justify-center">
            <ColoreActivityIndicator text="There seems to be an error..." />
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
              width: screenWidth * 4,
              height: screenHeight * 2,
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
                width: screenWidth * 4,
                height: screenHeight * 2,
              }}
            >
              <View className="flex-1 w-full h-full relative">
                <View className="relative flex-1">
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

{/* Render all posts independently */}
{postsWithPosition.map(post => {

const isViewed = excludeIds.includes(String(post.id))
  return (
<DraggablePostIt
  key={post.id}
  post={post}
  position={{
    top: post.position.top,
    left: post.position.left,
  }}
  updateIndex={() => handleReorderPost(post)}
  updatePosition={(dx, dy, post) => updatePostPosition(dx, dy, post)}
  onPress={() => handlePostPress(post)}
  isViewed={isViewed}
  showText={showPostItText}
  enabledPan={() => setIsPanningMode(prev => !prev)}
  zoomScale={zoomScale}
  scrollOffset={scrollOffset}
  disabled={isStackMoving}
  visibility={isStackMoving ? 0.5 : 1}
/>

)})}

</View>

            </View>

            {selectedPosts && (
              <PostModal
                isVisible={!!selectedPosts}
                selectedPosts={selectedPosts}
                handleCloseModal={handleCloseModal}
                handleUpdate={(isPinned: boolean) => handleIsPinned(isPinned)}
                invertedColors={invertColors}
              />
            )}
            {selectedModal && 
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
            }
          </ScrollView>
        </ScrollView>
      )}
      {/*</Pressable>*/}
  </SignedIn>
</View>

  );
};

export default PostItBoard;




/*

  const handleReloadPosts = () => {
    setLoading(true);
    fetchRandomPosts();
  };

  const handleGatherPosts = () => {
    //console.log("handleGatherPosts");
    if (maps.length > 0) {
      const ref = maps[maps.length - 1].coordinates;
      const newPostsPostions = postsWithPosition.map((post) => ({
        id: post.id,
        coordinates: {
          x_coordinate: ref.x_coordinate,
          y_coordinate: ref.y_coordinate,
        },
      }));
      setMap(newPostsPostions);
      //console.log("new posts", newPostsPostions)
    }
  };

  */


  // CLOSING MODAL

     /* if (selectedPost && !isPinned) {
      const postId = selectedPost.id;
      
     
      
    //console.log("Post to remove", selectedPost.id, "tria;l", i)
      setPostsWithPosition((prevPosts) => {
        const updatePosts = prevPosts.filter((post) => post.id !== postId);
       console.log(
          "post id list", "\n\n", 
          "Prev", prevPosts.map((p) => p.id), "\n\n",
          "Post",  postsWithPosition.map((p) => p.id), "\n\n", 
           "update", updatePosts.map((p) => p.id), "\n\n") 
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

      console.log("new post id", newPost.id)

  
        const newPostWithPosition: PostWithPosition = newPost;
        setPostsWithPosition((prevPosts) => [
          ...prevPosts,
          newPostWithPosition,
        ]);
        updatePostPosition(0, 0, newPostWithPosition);
      
       
      
    }*/

        /* ALTERNATIVE VERSION FOR SCROLLING
        
        <SignedIn>

      {error ? (
        <View className="flex-1 items-center justify-center">
        <ColoreActivityIndicator text="There seems to be an error..." />
        </View>
      ) : (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <GestureDetector gesture={combinedGestures}>
            <Animated.View 
              style={[
                { 
                  flex: 1,
                  width: '100%',
                  height: '100%'
                },
                animatedStyle
              ]}
            >
              <View style={{ 
                width: screenWidth * 3, 
                height: screenHeight * 3,
                position: 'absolute',
                left: -screenWidth, 
                top: -screenHeight,
                overflow: 'hidden'
              }}>
                {stacks.map(stack => {
                  const hasPostsOnCurrentBoard = postsWithPosition.some((p) => 
                    stack.ids.includes(p.id)
                  );

if (!hasPostsOnCurrentBoard) {
  return null;
}
  return (
  <StackCircle
    key={stack.name}
    stack={stack}
    scrollOffset={scrollOffset}
    isEditable={isEditable}
    onViewPress={() => {
       setSelectedPosts(stack.elements);
    }
    }
    onEditPress={() => {
      if (isEditable) {handleRenameStack(stack)}
    

    }}
    onSendPress={() => {}}
    enabledPan={() => setIsPanningMode(prev => !prev)}
    stackMoving={() => setIsStackMoving(prev => !prev)}
    updateStackPosition={(newX, newY, stack) => handleStackPosition(newX, newY, stack)}
    />
  )})}

                {postsWithPosition.map(post => (
                  <DraggablePostIt
                    key={post.id}
                    post={post}
                    position={{
                      top: post.position?.top ?? 0,
                      left: post.position?.left ?? 0,
                    }}
                    updateIndex={() => reorderPost(post)}
                    updatePosition={(dx, dy, post) => updatePostPosition(dx, dy, post)}
                    onPress={() => handlePostPress(post)}
                    showText={showPostItText}
                    enabledPan={() => setIsPanningMode(prev => !prev)}
                    zoomScale={zoomScale}
                    scrollOffset={scrollOffset}
                    disabled={isStackMoving}
                    visibility={isStackMoving ? 0.5 : 1}
                  />
                ))}
              </View>
            </Animated.View>
          </GestureDetector>
          
          {selectedPosts && (
            <PostModal
              isVisible={!!selectedPosts}
              selectedPosts={selectedPosts}
              handleCloseModal={handleCloseModal}
              handleUpdate={(isPinned: boolean) => handleIsPinned(isPinned)}
              invertedColors={invertColors}
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
        </GestureHandlerRootView>
      )}
    </SignedIn>
        
        
        */
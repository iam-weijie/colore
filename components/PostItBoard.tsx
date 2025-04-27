import { useGlobalContext } from "@/app/globalcontext";
import DraggablePostIt from "./DraggablePostIt";
import PostModal from "@/components/PostModal";
import { icons, temporaryColors } from "@/constants";
import { Post, PostWithPosition, Position, Stacks } from "@/types/type";
import { SignedIn } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import { AlgorithmRandomPosition, cleanStoredPosition } from "@/lib/utils";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  Dimensions,
  Easing,
  Image, 
  NativeScrollEvent, 
  NativeSyntheticEvent, 
  PanResponder,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { GeographicalMode, MappingPostitProps } from "@/types/type";
import ColoreActivityIndicator from "./ColoreActivityIndicator";
import React from "react";
import { distanceBetweenPosts } from "@/lib/post";
import { useFocusEffect } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { GlitterEmitter } from "./GlitterStars";
import StackCircle from "./StackCircle";
import ModalSheet from "./Modal";
import RenameContainer from "./RenameContainer";




const screenHeight = Dimensions.get("screen").height;
const screenWidth = Dimensions.get("screen").width;
const COLOR_HEIGHT_TRIGGER = 80;

const MappingPostIt = ({ id, coordinates }: MappingPostitProps) => {
  return {
    id: id,
    coordinates: {
      x_coordinate: coordinates.x_coordinate,
      y_coordinate: coordinates.y_coordinate,
    },
  };
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
  isEditable?: boolean;
}

const PostItBoard: React.FC<PostItBoardProps> = ({
  userId,
  handlePostsRefresh,
  handleNewPostFetch,
  handleUpdatePin,
  showPostItText = false,
  invertColors = false,
  mode = "world",
  isEditable = true,
}) => {
  const [postsWithPosition, setPostsWithPosition] = useState<
    PostWithPosition[]
  >([]);
  const [standalonePosts, setStandalonePosts] = useState<
  PostWithPosition[]
>([]);

  const { isIpad, stacks, setStacks } = useGlobalContext(); // Add more global constants here
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<PostWithPosition[] | null>(
    null
  );

  const [selectedModal, setSelectedModal] = useState<any>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  const [enableStacking, setEnableStacking] = useState<boolean>(false);
 
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [maps, setMap] = useState<MappingPostitProps[]>([]);
  const [isPanningMode, setIsPanningMode] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);
  const innerScrollViewRef = useRef<ScrollView>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const [zoomScale, setZoomScale] = useState(1); // default no zoom
  const offsetY = useSharedValue(0);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;  
    const y = event.nativeEvent.contentOffset.y;
    setScrollOffset({
      x:  x,
      y: y,
    });
    offsetY.value = Math.min(y, 0); // Only track pull-down
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(Math.abs(offsetY.value), { duration: 100 }),
      opacity: withTiming(Math.min(Math.abs(offsetY.value) / COLOR_HEIGHT_TRIGGER, 1)),
    };
  });

  if (!userId) {
    return null;
  }


  const fetchRandomPosts = async () => {
    setLoading(true);
    setEnableStacking(false);
    try {
      const posts: Post[] = await handlePostsRefresh();
      // set positions of posts

      const postsWithPositions: Array<Post & { position: Position }> = [];

      
        for (const post of posts) {
          const position = AlgorithmRandomPosition(post.pinned, null, posts.length);
          const positionWithOffset = {
            ...position,
            left: position.left + scrollOffset.x,
            top: position.top + scrollOffset.y,
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
      setEnableStacking(true);

    } catch (error) {
      setError("Failed to fetch new posts.");
      console.error(error);
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
  
    // 1. Check if the post is inside any existing stack circle
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

      // Create a new modified stack
      const updatedStack = {
        ...stack,
        ids: [...stack.ids, postId],
        elements: [...stack.elements, post],
      };
      
      // Replace it in the array
      updatedStacks[insideStackIndex] = updatedStack;
      
      setStacks(updatedStacks);
      return;
    }
  
    // 2. If post was inside any stack but now it's too far, remove it
    let wasInStack = false;
    updatedStacks = updatedStacks.map(stack => {
      if (stack.ids.includes(postId)) {
        wasInStack = true;
        const newIds = stack.ids.filter(id => id !== postId);
        const newElements = stack.elements.filter(p => p.id !== postId);
        return {
          ...stack,
          ids: newIds,
          elements: newElements,
        };
      }
      return stack;
    }).filter(stack => stack.ids.length > 0); // remove empty stacks
  
    if (wasInStack) {
      setStacks(updatedStacks);
      return;
    }
  
    // 3. If not in any stack already, maybe create a new stack
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
      //handleRenameStack(newStack);

      
  };
  

  }

  const handleRenameStack = (stack: Stacks) => {
    setSelectedTitle("Rename Stack")
    setSelectedModal(
      <RenameContainer
      initialValue={""}
      onSave={(newName: string) => {
        setStacks((prevStacks) => {
          const updatedStacks = prevStacks.map((s) => {
            const sameStack = 
              s.center.x === stack.center.x && 
              s.center.y === stack.center.y; // Match by center position
    
            if (sameStack) {
              return { ...s, name: newName };
            }
            return s;
          });
          return updatedStacks;
        });
        setSelectedModal(null);
        setSelectedTitle(null);
      
      }}
      onCancel={() => {
        setSelectedModal(null);
        setSelectedTitle(null);
      }}
      placeholder={stack.name}
    />)
  }

  const updatePostPosition = (
    dx: number,
    dy: number,
    post: PostWithPosition
  ) => {
    const id = post.id;


    const postItCoordinates = MappingPostIt({
      id: id,
      coordinates: { x_coordinate: dx, y_coordinate: dy },
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
    setStandalonePosts((prevPosts: PostWithPosition[]) => [
      ...prevPosts.filter((post) => post.id !== topPost.id), // Remove the moved post
      topPost, // Add the moved post to the end
    ]);

  };

  // USE EFFECTS
  useEffect(() => {
    if (maps.length > 1 && enableStacking) {
      console.log("Position", postsWithPosition[postsWithPosition.length - 1].id, postsWithPosition[postsWithPosition.length - 1].position, maps[maps.length - 1].coordinates )
      const newPostID = maps[maps.length - 1].id;
      const newPostScreenCoordinates = maps[maps.length - 1].coordinates;
      updateStacks(newPostID, newPostScreenCoordinates);
      console.log(stacks)
      //console.log("Position", postsWithPosition[postsWithPosition.length - 1].id, postsWithPosition[postsWithPosition.length - 1].position, maps[maps.length - 1].coordinates )
    }

    

    //console.log("stacks", stacks)
  }, [maps]);

  useEffect(() => {
    fetchRandomPosts();
    console.log("mode", mode)
  }, [mode]);


  const handleOuterLayout = () => {
    scrollViewRef.current?.scrollTo({ x: postsWithPosition[0].position.left ?? screenWidth / 2, animated: true })
  };

  const handleInnerLayout = () => {
    innerScrollViewRef.current?.scrollTo({ y: postsWithPosition[0].position.top ?? screenHeight / 2, animated: true })
  };

  const handlePostPress = async (post: PostWithPosition) => {
    
    // Ensure all required properties are present
    const stack = stacks.find((stack) => stack.ids.includes(post.id));
    if (stack) {
      setSelectedPosts(stack.elements);
      console.log("this is a stack")
    } else {
      setSelectedPosts([post]);
      console.log("this is a post", stack)
    }

    if (post.unread) {
      console.log("unread updating")
        try {
              await fetchAPI(`/api/notifications/updateUnreadPosts`, {
                method: "PATCH",
                body: JSON.stringify({
                  postId: post.id,
                })
              })
          }
        catch(error) {
            console.error("Failed to update unread message:", error);
          }
    }
    
    setIsPinned(post.pinned)
  };

  // HANDLING MODAL


  const handleIsPinned = (isPinned: boolean) => {
    setIsPinned(isPinned)
    const existingPostIds = postsWithPosition.map((post) => post.id);
    handleUpdatePin(existingPostIds)
  }
  let i = 0;

  const handleCloseModal = async () => {

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

      //("remainging right after", stacks)

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
    setSelectedPosts(null);
    setIsPanningMode(true);
  }

  




  if (postsWithPosition.length == 0) {
    return (
      <View className="flex-1 items-center justify-center">
          <ColoreActivityIndicator text="Summoning Bob..." />
            {/* Closing tag for the parent View */}
          </View>
    )
  }
  //console.log("remaingring loaded", stacks)

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate fetch or update
    await new Promise((res) => setTimeout(res, 1500));
    setRefreshing(false);
  };

  const stackedIds = new Set(stacks.flatMap((s) => s.ids));
  const filteredStandalone = standalonePosts.filter((post) => !stackedIds.has(post.id));
  

  const standaloneIds = new Set(standalonePosts.map(p => p.id));
  const allStackedIds = [...stackedIds];
  
  const postsWithPositionIds = postsWithPosition.map(p => p.id);
  
  // Find orphaned posts (in postsWithPosition but not in standalone or stack)
  const orphaned = postsWithPositionIds.filter(
    id => !standaloneIds.has(id) && !stackedIds.has(id)
  );
  
  // Optional: find duplicates (just for safety)
  const duplicates = postsWithPositionIds.filter(
    (id, index, self) => self.indexOf(id) !== index
  );
  
  // Log everything

  /*
  console.log(
    "🔍 Diagnostic Snapshot",
    "\n📦 postsWithPosition:", postsWithPositionIds,
    "\n🧍 standalonePosts:", [...standaloneIds],
    "\n📚 stackedPosts:", allStackedIds,
    "\n🧩 Orphaned Posts (only in postsWithPosition):", orphaned,
    "\n⚠️ Duplicate Post IDs (if any):", duplicates,
    "\n📊 Summary:",
    `\n   - postsWithPosition: ${postsWithPosition.length}`,
    `\n   - standalonePosts: ${standalonePosts.length}`,
    `\n   - stack posts: ${allStackedIds.length}`,
    `\n   - map post position posts: ${maps}`
  );

*/



  return (
    <View className="flex-1 bg-[#FAFAFA]">
        
        <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#ffe640', // Yellow color
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
          horizontal={true}
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
            <View className=" flex-1 w-full h-full relative">
            <View className="relative flex-1">

{/* Render stack circles */}
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
    />
  )})}

{/* Render all posts independently */}
{postsWithPosition.map(post => {

  return (
  <DraggablePostIt
    key={post.id}
    post={post}
    position={{
      top: post.position.top,
      left: post.position.left,
    }}
    updateIndex={() => reorderPost(post)}
    updatePosition={(dx, dy, post) => updatePostPosition(dx, dy, post)}
    onPress={() => handlePostPress(post)}
    showText={showPostItText}
    enabledPan={() => setIsPanningMode(prev => !prev)}
    zoomScale={zoomScale}
    scrollOffset={scrollOffset}
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
import { useGlobalContext } from "@/app/globalcontext";
import DraggablePostIt from "./DraggablePostIt";
import PostModal from "@/components/PostModal";
import { icons, temporaryColors } from "@/constants";
import { Post, PostWithPosition, Position } from "@/types/type";
import { SignedIn } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import { AlgorithmRandomPosition, cleanStoredPosition } from "@/lib/utils";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image, 
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
  const [postsWithPosition, setPostsWithPosition] = useState<
    PostWithPosition[]
  >([]);
  const { isIpad, stacks, setStacks } = useGlobalContext(); // Add more global constants here
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostWithPosition | null>(
    null
  );
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [maps, setMap] = useState<MappingPostitProps[]>([]);
  const [isPanningMode, setIsPanningMode] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);
  const innerScrollViewRef = useRef<ScrollView>(null);

  if (!userId) {
    return null;
  }


  const fetchRandomPosts = async () => {
    setLoading(true);
    try {
      const posts: Post[] = await handlePostsRefresh();
      // set positions of posts

      const postsWithPositions: Array<Post & { position: Position }> = [];
      // pick some “seed” position for the very first post
      let prevPosition = {
        top: Math.random() * (screenHeight - 160),
        left: Math.random() * (screenWidth - 160),
      };

      
        for (const post of posts) {
          const position = AlgorithmRandomPosition(post.pinned, null, posts.length);
          if (position) {
            postsWithPositions.push({ ...post, position });
          }
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
    console.log("mode", mode)
  }, [mode]);

  const handleOuterLayout = () => {
    scrollViewRef.current?.scrollTo({ x: postsWithPosition[0].position.left ?? screenWidth / 2, animated: true })
  };

  const handleInnerLayout = () => {
    innerScrollViewRef.current?.scrollTo({ y: postsWithPosition[0].position.top ?? screenHeight / 2, animated: true })
  };


  const forceStack = (id: number) => {
    return maps.find((p) => p.id == id);
  };
  const handlePostPress = async (post: PostWithPosition) => {
    // Ensure all required properties are present

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
  let i = 0;

  const handleCloseModal = async () => {

    if (selectedPost && !isPinned) {
      const postId = selectedPost.id;
      
     
      
    //console.log("Post to remove", selectedPost.id, "tria;l", i)
      setPostsWithPosition((prevPosts) => {
        const updatePosts = prevPosts.filter((post) => post.id !== postId);
      /*  console.log(
          "post id list", "\n\n", 
          "Prev", prevPosts.map((p) => p.id), "\n\n",
          "Post",  postsWithPosition.map((p) => p.id), "\n\n", 
           "update", updatePosts.map((p) => p.id), "\n\n") */
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
      
        setSelectedPost(null);
      
    } else {
      setSelectedPost(null)
    }
  }

  

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



  if (postsWithPosition.length == 0) {
    return (
      <View className="flex-1 items-center justify-center">
          <ColoreActivityIndicator text="Summoning Bob..." />
            {/* Closing tag for the parent View */}
          </View>
    )
  }
  //console.log("remaingring loaded", stacks)


  return (
    <View className="flex-1 bg-[#FAFAFA]">
  <SignedIn>
      {/*<Pressable
      className="flex-1"
  onTouchStart={() => {
    console.log("Started")
    panTimer.current = setTimeout(() => {
      setIsPanningMode(true);
      console.log("true")
    }, 200);
  }}
  onTouchEnd={() => {
    if (panTimer.current) clearTimeout(panTimer.current);
    setIsPanningMode(false);
    console.log("ended", isPanningMode)
  }}
  style={{ flex: 1 }}
>*/}
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
          maximumZoomScale={1.25}
          minimumZoomScale={0.75}
          contentContainerStyle={{
            width: screenWidth * 3,
            height: screenHeight * 3,
          }}
          scrollEnabled={isPanningMode}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          //refreshControl={}
          horizontal={true}
          nestedScrollEnabled
        >
          <ScrollView
            ref={innerScrollViewRef}
            onLayout={handleInnerLayout}
            nestedScrollEnabled
            scrollEnabled={isPanningMode}
            contentContainerStyle={{
              width: screenWidth * 3,
              height: screenHeight * 3,
            }}
            
          >
            <View className=" flex-1 w-full h-full relative">
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
                    enabledPan={() => {
                      setIsPanningMode((prev) => !prev)
                      console.log("did something")}}
                  />
                );
              })}
            </View>

            {selectedPost && (
              <PostModal
                isVisible={!!selectedPost}
                selectedPosts={[selectedPost]}
                handleCloseModal={handleCloseModal}
                handleUpdate={(isPinned: boolean) => handleIsPinned(isPinned)}
                invertedColors={invertColors}
              />
            )}
          </ScrollView>
        </ScrollView>
      )}
      {/*</Pressable>*/}
  </SignedIn>
</View>
  );
};

export default PostItBoard;

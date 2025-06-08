import { useGlobalContext } from "@/app/globalcontext";
import DraggablePostIt from "./DraggablePostIt";
import PostModal from "@/components/PostModal";
import { Post, PostWithPosition, Stacks, PostItBoardProps } from "@/types/type";
import { SignedIn } from "@clerk/clerk-expo";
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
import { MappingPostitProps } from "@/types/type";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import ColoreActivityIndicator from "./ColoreActivityIndicator";
import React, { useEffect, useRef, useState } from "react";
import { mappingPostIt, reorderPost } from '@/lib/postItBoard';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import StackCircle from "./StackCircle";
import ModalSheet from "./Modal";
import RenameContainer from "./RenameContainer";
import { updateStacks } from "@/lib/stack";

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
  const [mapType, setMapType] = useState("satellite");
  const [postsWithPosition, setPostsWithPosition] = useState<Post[]>([]);
  const [standalonePosts, setStandalonePosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<Post[] | null>(null);
  const [excludeIds, setExcludeIds] = useState<string[]>([]);
  const [selectedModal, setSelectedModal] = useState<any>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [enableStacking, setEnableStacking] = useState(false);
  const [forceMoveMap, setForceMoveMap] = useState<{ [postId: number]: { dx: number, dy: number } }>({});
  const [isPinned, setIsPinned] = useState(false);
  const [maps, setMap] = useState<MappingPostitProps[]>([]);
  const [isPanningMode, setIsPanningMode] = useState(true);
  const [isStackMoving, setIsStackMoving] = useState(false);
  const [allPostsInStack, setAllPostsInStack] = useState<Post[]>([]);

  const { stacks, setStacks } = useGlobalContext();
  const { playSoundEffect } = useSoundEffects();

  const scrollViewRef = useRef<ScrollView>(null);
  const innerScrollViewRef = useRef<ScrollView>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const [zoomScale, setZoomScale] = useState(1);
  const offsetY = useSharedValue(0);
  const pendingStackSound = useRef(false);
  const stackUpdating = useRef(false);

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

  // --- HANDLER FUNCTIONS ---

  const handleRenameStack = (stack: Stacks) => {
    setSelectedTitle("Rename Stack");
    setSelectedModal(
      <RenameContainer
        initialValue={""}
        onSave={(newName: string) => {
          setStacks((prevStacks) =>
            prevStacks.map((s) =>
              s.center.x === stack.center.x && s.center.y === stack.center.y
                ? { ...s, name: newName }
                : s
            )
          );
          setSelectedModal(null);
          setSelectedTitle(null);
        }}
        onCancel={() => {
          setSelectedModal(null);
          setSelectedTitle(null);
        }}
        placeholder={stack.name}
      />
    );
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

  const handleIsPinned = (isPinned: boolean) => {
    setIsPinned(isPinned);
    const existingPostIds = postsWithPosition.map((post) => post.id);
    handleUpdatePin(existingPostIds);
  };

  const handleCloseModal = () => {
    setSelectedPosts(null);
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
                        onSendPress={() => {}}
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
              </View>

              {/* Modals */}
              {selectedPosts && (
                <PostModal
                  isVisible={!!selectedPosts}
                  selectedPosts={selectedPosts}
                  handleCloseModal={handleCloseModal}
                  handleUpdate={handleIsPinned}
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
            </ScrollView>
          </ScrollView>
        )}
      </SignedIn>
    </View>
  );
};

export default PostItBoard;

import { useGlobalContext } from "@/app/globalcontext";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects"; // Import sound hook
import { icons, temporaryColors } from "@/constants/index";
import { 
    handleReportPress,
    handleReadComments, 
    handleEditing,
    handlePin,
    handleShare,
    handleSavePost } from "@/lib/post";
import { fetchAPI } from "@/lib/fetch";
import { convertToLocal, formatDateTruncatedMonth } from "@/lib/utils";
import {
  Post,
  PostItColor,
  PostContainerProps,
  UserNicknamePair,
  PostWithPosition,
} from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ImageSourcePropType,
  Platform,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import ReactNativeModal from "react-native-modal";
import ModalSheet from "@/components/Modal";
import Animated, {
  BounceIn,
  Easing,
  FadeInUp,
  FadeOutDown,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn
} from "react-native-reanimated";
import { captureRef } from "react-native-view-shot";
import DropdownMenu from "./DropdownMenu";
import { useAlert } from '@/notifications/AlertContext';
import InteractionButton from "./InteractionButton";
import CarrouselIndicator from "./CarrouselIndicator";
import EmojiExplosionModal from "./EmojiExplosiveModal";
import PostScreen from "@/app/root/post/[id]";
import ItemContainer from "./ItemContainer";
import EmojiBackground from "./EmojiBackground";


const { width, height } = Dimensions.get("window");



const AnimatedView = Animated.createAnimatedComponent(View);

const PostContainer: React.FC<PostContainerProps> = ({
  selectedPosts,
  handleCloseModal,
  handleUpdate,
  invertedColors = false,
  infiniteScroll = false,
  isPreview = false,
  header,
  scrollToLoad,
}) => {
  const { stacks, isIpad, soundEffectsEnabled } = useGlobalContext(); // Add soundEffectsEnabled
  const { playSoundEffect } = useSoundEffects(); // Get sound function
  const { user } = useUser();
  const [nickname, setNickname] = useState<string>("");
  const [currentPost, setCurrentPost] = useState<Post>();
  const [currentPostIndex, setCurrentPostIndex] = useState<number>(0);
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isLoadingLike, setIsLoadingLike] = useState<boolean>(false);
  const [showEmojiModal, setShowEmojiModal] = useState<boolean>(false);
  const [selectedBoard, setSelectedBoard] = useState<any | null>(null);
  const { showAlert } = useAlert();
  const router = useRouter();
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const viewRef = useRef<View>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Memoize the posts array to prevent unnecessary re-renders
  const post = selectedPosts


  useEffect(() => {
    fetchUserdata();
    fetchLikeStatus();
  }, [isSaved, isLiked, user]);

  useEffect(() => {
    if (post.length) {
      setPosts(post);
      setCurrentPost(post[currentPostIndex]);
    }
  }, [post]);

  const fetchLikeStatus = async () => {
    try {
      const response = await fetchAPI(
        `/api/posts/updateLikeCount?postId=${post[currentPostIndex].id}&userId=${user!.id}`,
        { method: "GET" }
      );
      if (response.error) return;

      setIsLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
    } catch (error) {
      console.error("Failed to fetch like status:", error);
    }
  };

  useEffect(() => {
    setCurrentPost(post[currentPostIndex]);


    if (infiniteScroll && typeof scrollToLoad === "function" && currentPostIndex + 1 === posts.length - 1) {
      // If last post and infiniteScroll is enabled
      runOnJS(scrollToLoad)();
      
    } 
  }, [currentPostIndex])
  // Fetch like status only when post or user changes
  useEffect(() => {
    if (!user?.id || !currentPost?.id) return;
    fetchLikeStatus();
    setIsPinned(currentPost?.pinned)
  }, [post, currentPostIndex, user?.id]);

  const dateCreated = convertToLocal(
    new Date(currentPost?.created_at || "")
  );
  const formattedDate = formatDateTruncatedMonth(dateCreated);
  const postColor = temporaryColors.find(
    (color) => color.name === currentPost?.color
  ) as PostItColor;


  const swipeGesture = Gesture.Pan()
    .onStart((event) => {
      console.log("Swipe started");
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd(() => {
      const threshold = 15;
      const isLastPost = currentPostIndex === posts.length - 1;


      
      if (translateX.value > threshold && currentPostIndex > 0) {
        translateX.value = withTiming(0);
        opacity.value = withTiming(0, {}, () => {
          runOnJS(setCurrentPostIndex)(currentPostIndex - 1);
          opacity.value = withTiming(1);
        });
      } else if (translateX.value < -threshold) {
        if (!isLastPost) {
          // Swipe left: go to next post
          translateX.value = withTiming(0);
          opacity.value = withTiming(0, {}, () => {
            runOnJS(setCurrentPostIndex)(currentPostIndex + 1);
            opacity.value = withTiming(1);
          });
        } else {
          // Bounce back
          translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        }
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    })

  // Animated styles for swiping
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(translateX.value, {
          damping: 20,
          stiffness: 300,
        }),
      },
    ],
    opacity: withTiming(opacity.value),
  }));

  const handleLikePress = async () => {
    if (isLoadingLike || !currentPost?.id || !user?.id) return;
    setIsLoadingLike(true);
    try {
      // Play like sound if liking (not unliking) and enabled
      if (!isLiked && soundEffectsEnabled) {
        playSoundEffect(SoundType.Like);
      }
      const increment = !isLiked;
      setIsLiked(increment);
      setLikeCount((prev) => (increment ? prev + 1 : prev - 1));

      const response = await fetchAPI(`/api/posts/updateLikeCount`, {
        method: "PATCH",
        body: JSON.stringify({
          postId: currentPost.id,
          userId: user.id,
          increment,
        }),
      });

      if (response.error) {
        setIsLiked(!increment);
        setLikeCount((prev) => (increment ? prev - 1 : prev + 1));
        showAlert({
          title: 'Error',
          message: "Unable to update like status.",
          type: 'ERROR',
          status: 'error',
        });
        return;
      }

      setIsLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
    } catch (error) {
      console.error("Failed to update like status:", error);
    } finally {
      setIsLoadingLike(false);
    }
  };

  function findUserNickname(
    userArray: UserNicknamePair[],
    userId: string
  ): number {
    const index = userArray.findIndex((pair) => pair[0] === userId);
    return index;
  }

  const fetchCurrentNickname = async () => {
    try {
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`, {
        method: "GET",
      });
      if (response.error) {
        throw new Error(response.error);
      }
      const nicknames = response.data[0].nicknames || [];
      return findUserNickname(nicknames, post!.clerk_id) === -1
        ? ""
        : nicknames[findUserNickname(nicknames, post!.user_id)][1];
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };
  useEffect(() => {
    const getData = async () => {
      const nickname = await fetchCurrentNickname();
      setNickname(nickname);
    };
    getData();
  }, [user]);

  const fetchUserdata = async () => {
    try {
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`);
      const savePostsList = response.data[0].saved_posts;
      const savedStatus = savePostsList?.includes(
        `${currentPost?.id}`
      ) ?? false;
      setSavedPosts(savePostsList);
      setIsSaved(savedStatus);
    } catch (error) {
      console.error("Failed to fetch user data", error);
    }
  };

  const handleDeletePress = async () => {
    handleCloseModal();
    
    showAlert({
      title: 'Delete Post',
      message: "Are you sure you want to delete this post?",
      type: 'DELETE',
      status: 'success',
      action: async () => {
        try {
            const response = await fetchAPI(
              `/api/posts/deletePost?id=${currentPost?.id}`,
              {
                method: "DELETE",
              }
            );
      
            if (response.error) {
              throw new Error(response.error);
            }
      
            
          } catch (error) {
            console.error("Failed to delete post:", error);
            showAlert({
              title: 'Error',
              message: "Failed to delete post. Please try again.",
              type: 'ERROR',
              status: 'error',
            });
          } finally {
            showAlert({
              title: 'Post deleted',
              message: "Your post has been deleted successfully.",
              type: 'DELETE',
              status: 'success',
            });
          }
      },
      actionText: "Delete",
      duration: 5000,
    });
  };

  const handleCommentsPress = () => {
   setSelectedBoard(() => <PostScreen id={currentPost?.id.toString()} clerkId={currentPost?.clerk_id} />); 
  };



  const handleInteractionPress = async (emoji: string) => {

    try {
      console.log("Patching prompts")
      
      await fetchAPI(`/api/prompts/updateEngagement`, {
        method: "PATCH",
        body: JSON.stringify({
          clerkId: user?.id,
          promptId: currentPost?.prompt_id
        }),
      });
    } catch (error) {
      console.error("Failed to update unread comments:", error);
    } finally {
      setSelectedEmoji(emoji)
      const timeoutId = setTimeout(() => {
      setCurrentPostIndex((prevIndex) => {
        const newIndex = prevIndex + 1;
        if (newIndex < 0) {
          return posts.length - 1; // Loop back to the last post
        } else if (newIndex >= posts.length) {
          return 0; // Loop back to the first post
        }
        return newIndex;
      }
      );
      translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      opacity.value = withTiming(0, {}, () => {
        runOnJS(setCurrentPostIndex)(currentPostIndex + 1);
        opacity.value = withTiming(1);
      }
      );
      if (soundEffectsEnabled) {
        //playSoundEffect(SoundType.Dislike);
      }
    }, 2000)
    return () => clearTimeout(timeoutId);
    }
   
  }

  // Capture the content as soon as the component mounts (first render)
  useEffect(() => {
    if (selectedPosts) {
      setTimeout(() => {
        handleCapture(); // Capture content on first render when modal is visible
      }, 800);
    }
  }, [selectedPosts]);
  useEffect(() => {
    setTimeout(() => {
      if (viewRef.current) {
        viewRef.current.measure((x, y, width, height) => {
          // console.log(x, y, width, height);
        });
      }
    }, 500); // Small delay to ensure the view is ready
  }, []);

  const handleCapture = async () => {
    if (!selectedPosts) {
      console.warn("Modal is not visible, skipping capture.");
      return;
    }

    if (viewRef.current) {
      try {
        const uri = await captureRef(viewRef.current, {
          format: "png",
          quality: 0.8,
        });

        setImageUri(uri); // Save the captured URI for later sharing
      } catch (error) {
        console.error("Error capturing view:", error);
      }
    }
  };


  const getMenuItems = (isOwner: boolean, invertedColors: boolean, isPreview: boolean) => {
    if (isPreview) {
      return []; // Return empty array when in preview mode to disable menu
    }
    
    if (invertedColors) {
      return currentPost?.recipient_user_id == user!.id ? [
        {
          label: isPinned ? "Unpin" : "Pin",
          source: icons.pin,
          color: "#000000",
          onPress: () => {
            handlePin(currentPost, isPinned, user!.id)
            handleUpdate(!isPinned)
            setIsPinned((prevIsPinned) => !prevIsPinned);
            handleCloseModal;
        }
        },
        {
          label: "Share",
          source: icons.send,
          color: postColor?.fontColor || "rgba(0, 0, 0, 0.5)",
          onPress: () => {handleShare(imageUri, currentPost)},
        },
        {
          label: "Delete",
          source: icons.trash,
          color: "#DA0808",
          onPress: handleDeletePress,
        },
      ] : [
        {
          label: "Share",
          source: icons.send,
          color: postColor?.fontColor || "rgba(0, 0, 0, 0.5)",
          onPress: () => {handleShare(imageUri, currentPost)},
        },
        {
          label: isSaved ? "Remove" : "Save",
          color: "#000000",
          source: isSaved ? icons.close : icons.bookmark,
          onPress: () => {
            handleSavePost(currentPost?.id, isSaved, user!.id)
            setIsSaved((prevIsSaved) => !prevIsSaved);},
        },
        {
          label: "Report",
          source: icons.email,
          color: "#DA0808",
          onPress: handleReportPress,
        },
      ];

    }

    return isOwner
      ? [
          {
            label: "Share",
            source: icons.send,
            color: postColor?.fontColor || "rgba(0, 0, 0, 0.5)",
            onPress: () => {handleShare(imageUri, currentPost)},
          },
          {
            label: "Edit",
            source: icons.pencil,
            color: "#0851DA",
            onPress:() => {
                setTimeout(() => {
                    handleCloseModal();
                  }, 250);
                handleEditing(currentPost)
            } ,
          },
          {
            label: isSaved ? "Remove" : "Save",
            color: "#000000",
            source: isSaved ? icons.close : icons.bookmark,
            onPress: () => {
                handleSavePost(currentPost?.id, isSaved, user!.id)
                setIsSaved((prevIsSaved) => !prevIsSaved);},
          },
          {
            label: "Delete",
            source: icons.trash,
            color: "#DA0808",
            onPress: handleDeletePress,
          }
        ]
      : [
          {
            label: "Share",
            source: icons.send,
            color: postColor?.fontColor || "rgba(0, 0, 0, 0.5)",
            onPress: () => {handleShare(imageUri, currentPost)},
          },
          {
            label: isSaved ? "Remove" : "Save",
            color: "#000000",
            source: isSaved ? icons.close : icons.bookmark,
            onPress: () => {
                handleSavePost(currentPost?.id, isSaved, user!.id)
                setIsSaved((prevIsSaved) => !prevIsSaved);},
          },
          {
            label: "Report",
            source: icons.email,
            color: "#DA0808",
            onPress: handleReportPress,
          },
        ];
  };

  const backgroundColor = useSharedValue(postColor?.hex || "rgba(0, 0, 0, 0.5)");
  const prevColor = React.useRef(backgroundColor.value);

  // Animate color change
  useEffect(() => {
    if (prevColor.current !== (postColor?.hex || "rgba(0, 0, 0, 0.5)")) {
      backgroundColor.value = withTiming(
        postColor?.hex || "rgba(0, 0, 0, 0.5)",
        {
          duration: 300,
          easing: Easing.inOut(Easing.quad)
        }
      );
      prevColor.current = postColor?.hex || "rgba(0, 0, 0, 0.5)";
    }
  }, [postColor]);


  useEffect(() => {

    const timeoutId = setTimeout(() => {
      setSelectedEmoji(post[currentPostIndex]?.emoji);
    }, 300);
  
    return () => clearTimeout(timeoutId);
  }, [post, currentPost])


  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
  }));

  useFocusEffect(
    useCallback(() => {
      // Screen is focused
  
      return () => {
        setTimeout(() => {
          handleCloseModal();
          setSelectedBoard(null)
        }, 250);
      };
    }, [])
  );


  return (

        <AnimatedView
          ref={viewRef}
          className="flex-1 absolute w-screen h-screen justify-center"
          //entering={FadeInUp.duration(300)}
          style={[
            animatedBackgroundStyle
          ]}
        >
          <TouchableWithoutFeedback onPress={handleCloseModal}>
            <View className="absolute flex-1 ">
            {<EmojiBackground emoji="" color="" />}
            </View>
          
          </TouchableWithoutFeedback>

          {header}
          {currentPost?.prompt &&  <Animated.View 
          className="absolute w-full top-[20%] mx-auto flex-row items-center justify-center"
          entering={FadeInUp.duration(200)}
          exiting={FadeOutDown.duration(200)}>
            <View 
            className="w-[75%] max-w-[300px]"
            style={{
              transform: [{rotate: `${(Math.random() - 0.5)*10}deg` }]
            }}
            >
             <ItemContainer 
             label={currentPost?.prompt}
             icon={icons.fire}
             colors={[currentPost?.color, "#FFB512"]}
             iconColor="#000"
             onPress={() => {
              router.push({
                pathname: "/root/new-post",
                params: {
                  prompt: currentPost?.prompt,
                  promptId: currentPost?.prompt_id
                }
              })
             }}
             />
             </View>
            </Animated.View>}

          <GestureHandlerRootView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <GestureDetector gesture={swipeGesture}>
              <Animated.View
                entering={FadeInUp.duration(400)}
                exiting={FadeOutDown.duration(250)}
                className="bg-white px-6 py-4 rounded-[24px] w-[80%] max-w-[500px] mx-auto"
                style={[
                  animatedStyle,
                  {
                    minHeight:isIpad ? 250 : 200,
                    maxHeight: isIpad ? "55%" : "40%",
                    backgroundColor: "rgba(255, 255, 255, 1)",
                  },
                ]}
              >
                <TouchableOpacity onPress={handleCloseModal}>
                  <Image
                    source={icons.close}
                    style={{ width: 18, height: 18, top: 4, alignSelf: "flex-end", opacity: 0.5 }}
                  />
                </TouchableOpacity>

                <ScrollView>
                  <Text className="text-[16px] p-1 my-4 font-Jakarta">
                  {currentPost?.content}
                  </Text>
                </ScrollView>
                {!isPreview && (
                  <View className="my-2 flex-row justify-between items-center">
                    <View className="flex flex-row items-center">
                      <TouchableOpacity onPress={handleCommentsPress}>
                        <Image source={icons.comment} className="w-8 h-8" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleLikePress} className="ml-2">
                        <MaterialCommunityIcons
                          name={isLiked ? "heart" : "heart-outline"}
                          size={32}
                          color={isLiked ? "red" : "black"}
                        />
                      </TouchableOpacity>
                      {/* Show like count only to post creator */}
                    {currentPost?.user_id == user?.id && (
                        <Text className="ml-1 text-gray-600">{likeCount}</Text>
                      )}
                    </View>
                    {
                      <DropdownMenu
                        menuItems={getMenuItems(
                          currentPost?.clerk_id === user!.id ||
                            currentPost?.recipient_user_id === user!.id,
                          invertedColors,
                          isPreview
                        )}
                      />
                    }
                  </View>
                )}
              </Animated.View>
            </GestureDetector>
          </GestureHandlerRootView>
           {infiniteScroll ? (
            <View className="absolute top-[75%] self-center flex flex-row items-center justify-center">
              {currentPost?.prompt_id && <InteractionButton 
              label="Nay"
              icon={icons.close}
              showLabel={true}
              color={"#FF0000"}
              onPress={() => 
                handleInteractionPress("😤")}
              />}
              <InteractionButton 
              label="Reply"
              icon={icons.pencil}
              showLabel={true}
              color={postColor?.fontColor || "rgba(0, 0, 0, 0.5)"}
              onPress={() => {
                handleCloseModal();
                if (currentPost?.prompt_id) {
                  router.push({  
                    pathname: "/root/new-post",
                    params: {
                      promptId: currentPost?.prompt_id,
                      prompt: currentPost?.prompt,
                      source: "board"
                    },
                })
                } else {
                  router.push({  
                    pathname: "/root/new-post",
                    params: {
                      recipient_id: currentPost?.clerk_id,
                      username: currentPost?.username,
                      source: "board"
                    },
                })
                }
              
             
              if (soundEffectsEnabled) {  
                //playSoundEffect(SoundType.Reply);
              }
            }}
              />
              {currentPost?.prompt_id && 
                <InteractionButton 
              label="Hard agree"
              icon={icons.check}
              showLabel={true}
              color={"#000000"}
              onPress={() =>
                handleInteractionPress("🤩")}
              />}

            </View>
           ) : (<View className="absolute top-[10%] left-[10%]  flex flex-row">
            {posts.length > 1 &&
              posts.map((post, index) => {
                return (
                  <CarrouselIndicator
                    key={post.id}
                    id={index}
                    index={currentPostIndex}
                  />
                );
              })}
          </View>)}
          {!!selectedEmoji && 
          
          
          <View className="absolute -top-[150px] self-center inset-0">
            <EmojiExplosionModal
              isVisible={!!selectedEmoji}
              verticalForce={50}
              radius={isIpad ? 1200 : 800}
              emojiSize="text-[150px]"
              duration={8000}
              emoji={selectedEmoji}
              onComplete={() => {
                setSelectedEmoji("")
                console.log("done")
              }}
            />
          </View>
          }
            {!!selectedBoard &&
          <ModalSheet 
            isVisible={!!selectedBoard}
            title={"Comments"}
            onClose={() => {
              if (currentPost) {
                handleReadComments(currentPost, user!.id);
              }
              console.log("has closed.")
              setSelectedBoard(null)
            }}
            >
              <View className="flex-1 h-full">
              {selectedBoard}
              </View>
              
              </ModalSheet>
}
        </AnimatedView>
 
        
  );
};

export default PostContainer;
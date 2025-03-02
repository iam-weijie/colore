import CustomButton from "@/components/CustomButton";
import DropdownMenu from "@/components/DropdownMenu";
import { icons, temporaryColors } from "@/constants/index";
import { fetchAPI } from "@/lib/fetch";
import { convertToLocal, formatDateTruncatedMonth } from "@/lib/utils";
import { PostComment, UserNicknamePair, PostItColor } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  FadeInUp,
  FadeOutDown,
  runOnJS
} from "react-native-reanimated";
import { 
  PanGestureHandlerGestureEvent, 
  GestureHandlerRootView, 
  PanGestureHandler  } from "react-native-gesture-handler";

import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { create } from "react-test-renderer";

interface GestureContext {
  startX: number;
  startY: number;
}

const CommentItem: React.FC<PostComment> = ({
  id,
  post_id,
  user_id,
  sender_id,
  content,
  username,
  created_at,
  like_count,
  is_liked,
  postColor
}) => {
  const { user } = useUser();
  const router = useRouter();
  const [showTime, setShowTime] = useState(false);

// Comment like constant
const [tapCount, setTapCount] = useState(0);
  const [isLoadingLike, setIsLoadingLike] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(is_liked);
  const [likeCount, setLikeCount] = useState<number>(like_count);
  const [commentLikes, setCommentLikes] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [commentLikeCounts, setCommentLikeCounts] = useState<{
    [key: string]: number;
  }>({});
  const [isLoadingCommentLike, setIsLoadingCommentLike] =
    useState<boolean>(false);


  // Report Logic
  const handleReportPress = () => {
    Alert.alert(
      "Report Comment",
      "Are you sure you want to report this comment?",
      [
        { text: "Cancel" ,
          style: "cancel",
        },
        { text: "Report", onPress: (() => (Linking.openURL("mailto:support@colore.ca"))) },
      ]
    )
    
  };
  // Comment Like Logic
  const handleCommentLike = async (commentId: number) => {
    if (!user || isLoadingCommentLike) return;

    try {
      setIsLoadingCommentLike(true);
      const isCurrentlyLiked = commentLikes[commentId];

      // Optimistic update
      setCommentLikes((prev) => ({ ...prev, [commentId]: !isCurrentlyLiked }));
      setCommentLikeCounts((prev) => ({
        ...prev,
        [commentId]: prev[commentId] + (isCurrentlyLiked ? -1 : 1),
      }));

      const response = await fetchAPI("/api/comments/updateCommentLike", {
        method: "PATCH",
        body: JSON.stringify({
          commentId,
          userId: user.id,
          increment: !isCurrentlyLiked,
        }),
      });

      if (response.error) {
        // Revert optimistic update
        setCommentLikes((prev) => ({ ...prev, [commentId]: isCurrentlyLiked }));
        setCommentLikeCounts((prev) => ({
          ...prev,
          [commentId]: prev[commentId] + (isCurrentlyLiked ? 1 : -1),
        }));
        Alert.alert("Error", "Unable to update like status");
        return;
      }

      // Update with server values
      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: response.data.liked,
      }));
      setCommentLikeCounts((prev) => ({
        ...prev,
        [commentId]: response.data.likeCount,
      }));
      setIsLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
    } catch (error) {
      console.error("Failed to update comment like:", error);
      // Revert optimistic update on error
      const isCurrentlyLiked = commentLikes[commentId];
      setCommentLikes((prev) => ({ ...prev, [commentId]: isCurrentlyLiked }));
      setCommentLikeCounts((prev) => ({
        ...prev,
        [commentId]: prev[commentId] + (isCurrentlyLiked ? 1 : -1),
      }));
    } finally {
      setIsLoadingCommentLike(false);
    }
  };


  const translateX = useSharedValue(0);

  // Maximum swipe distance
  const maxSwipe = 90; // Adjust as needed
  const minSwipe = -90; // Adjust as needed

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureContext>({
    onStart: (_, context) => {
      context.startX = translateX.value;
     
    },
    onActive: (event, context) => {
      // Calculate the translation, limit swipe range
      const translationX = context.startX + event.translationX;
      translateX.value = Math.max(Math.min(translationX, maxSwipe), minSwipe);
      // Show time while active swipe
      runOnJS(setShowTime)(true);
    },
    onEnd: () => {
    // Hide time after swipe ends
      runOnJS(setShowTime)(false);
      translateX.value = withTiming(0, { damping: 20, stiffness: 300 }); // Use `withTiming` to reset smoothly
    },
  });

  const doubleTapHandler = () => {
    setTapCount((prevCount) => prevCount + 1);
  };

  useEffect(() => {
    if (tapCount === 2) {
      
      // Handle double-tap
      handleCommentLike(id);
      setTapCount(0); // Reset tap count
    }
  }, [tapCount]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(translateX.value, { damping: 20, stiffness: 300 }) }],
  }));

  return (
    <GestureHandlerRootView style={{ justifyContent: "center", alignItems: "center" }}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View
          className="p-3 rounded-2xl max-w-[70%]"
          style={[
            animatedStyle, // Apply animated style here
            {
              backgroundColor: user_id === user?.id ? 'black' : (user_id == sender_id ? postColor : '#e5e7eb'),
              alignSelf: user_id === user?.id ? 'flex-end' : 'flex-start',
              marginTop: username ? 32 : 8,
            },
          ]}
        >
            <View className="absolute flex -mt-6" 
            style={{
              [user_id === user?.id ? 'right' : 'left']: 5,
            }}>
              <TouchableOpacity activeOpacity={0.6}  onPress={() =>{
                router.push({
                  pathname: "/root/profile/[id]",
                  params: { id: user_id},
                });
              }}>
        <Text 
           className="font-JakartaSemiBold">
            {username}
            </Text>
            </TouchableOpacity>
        </View>
        <TouchableOpacity activeOpacity={0.85} onPress={() => {doubleTapHandler();}} onLongPress={() => {handleReportPress();}}>
          <Text className="text-[14px] font-600" style={{ color: user_id === user?.id ? 'white' : 'black' }}>
            {content}
          </Text>
          </TouchableOpacity>
          <View className="absolute flex flex-row items-center" style={{
            alignSelf: user_id === user?.id ? 'flex-start' : 'flex-end',
            [user_id === user?.id ? 'left' : 'right']: (user_id !== user!.id ? -32 : -16),
            top: "60%"
          }}>  
           {/* Only show like count to post creator */}
           <Text
                    className={`${user_id === user?.id ? "text-gray-600" : "text-transparent"} text-center`}
                  >
                    {(user_id === user?.id ? likeCount : "0") != "0" ? likeCount : ""}
                  </Text>
                 {user_id !== user!.id && <TouchableOpacity
                    onPress={async () => {
                      await handleCommentLike(id); 
                    }}
                    disabled={isLoadingLike}
                  >
                    {isLiked && <MaterialCommunityIcons
                      name={isLiked ? "heart" : "heart-outline"}
                      size={20}
                      color={isLiked ? "red" : "black"}
                    />}
                  </TouchableOpacity>}
                 
                </View>

          {showTime && (
            <View style={{
              alignSelf: user_id == user?.id ? 'flex-end' : 'flex-start',
              [user_id === user?.id ? 'right' : 'left']: -85, 
              bottom: 0

            }} className="absolute">
              <Text className="text-xs text-gray-500 mt-1">
                {typeof created_at === "string"
                    ? formatDateTruncatedMonth(
                        convertToLocal(new Date(created_at))
                      )
                    : "No date"}
              </Text>
            </View>
          )}
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

const PostScreen = () => {
  const { user } = useUser();
  const router = useRouter();
  const navigation = useNavigation();
  const {
    id = "",
    clerk_id = "",
    content = "",
    nickname,
    firstname,
    username,
    like_count,
    report_count,
    created_at,
    unread_comments = 0,
    anonymous = false,
    color,
    saved
  } = useLocalSearchParams();


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<PostComment>>(null);
  const [postComments, setPostComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [nicknames, setNicknames] = useState<UserNicknamePair[]>([]);
  const [anonymousComments, setAnonymousComments] = useState<boolean>(anonymous === "true");
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(
    typeof like_count === "string" ? parseInt(like_count) : 0
  );
  const [isLoadingLike, setIsLoadingLike] = useState<boolean>(false);
  const [commentLikes, setCommentLikes] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [commentLikeCounts, setCommentLikeCounts] = useState<{
    [key: string]: number;
  }>({});
  const [isLoadingCommentLike, setIsLoadingCommentLike] =
    useState<boolean>(false);

  const maxCharacters = 6000;
  const displayName = Array.isArray(firstname) ? firstname[0] : firstname;
  const userId = Array.isArray(clerk_id) ? clerk_id[0] : clerk_id;
  const screenHeight = Dimensions.get("screen").height;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPostDeleted, setIsPostDeleted] = useState(false);
  const postColor = temporaryColors.find(
      (c) => c.name === color
    ) as PostItColor;

  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!id || !user?.id) return;

      try {
        const response = await fetchAPI(
          `/api/posts/updateLikeCount?postId=${id}&userId=${user.id}`,
          { method: "GET" }
        );

        if (response.error) {
          console.error("Error fetching like status:", response.error);
          return;
        }

        setIsLiked(response.data.liked);
        setLikeCount(response.data.likeCount);
      } catch (error) {
        console.error("Failed to fetch like status:", error);
      }
    };

    fetchLikeStatus();
  }, [id, user?.id]);

  useFocusEffect(
    useCallback(() => {
      setAnonymousComments(anonymous === "true");
    }, []))

  // Updated like handler
  const handleLikePress = async () => {
    if (!id || !user?.id || isLoadingLike) return;

    try {
      setIsLoadingLike(true);
      const increment = !isLiked;

      // Optimistically update UI
      setIsLiked(!isLiked);
      setLikeCount((prev) => (increment ? prev + 1 : prev - 1));

      const response = await fetchAPI(`/api/posts/updateLikeCount`, {
        method: "PATCH",
        body: JSON.stringify({
          postId: id,
          userId: user.id,
          increment,
        }),
      });

      if (response.error) {
        // Revert optimistic update if failed
        setIsLiked(isLiked);
        setLikeCount((prev) => (increment ? prev - 1 : prev + 1));
        Alert.alert("Error", "Unable to update like status. Please try again.");
        return;
      }

      // Update with actual server values
      setLikeCount(response.data.likeCount);
      setIsLiked(response.data.liked);
    } catch (error) {
      console.error("Failed to update like status:", error);
      // Revert optimistic update
      setIsLiked(isLiked);
      setLikeCount((prev) => (!isLiked ? prev - 1 : prev + 1));
      Alert.alert(
        "Error",
        "Unable to update like status. Please check your connection."
      );
    } finally {
      setIsLoadingLike(false);
    }
  };

  const handleCommentLike = async (commentId: number) => {
    if (!user || isLoadingCommentLike) return;

    try {
      setIsLoadingCommentLike(true);
      const isCurrentlyLiked = commentLikes[commentId];

      // Optimistic update
      setCommentLikes((prev) => ({ ...prev, [commentId]: !isCurrentlyLiked }));
      setCommentLikeCounts((prev) => ({
        ...prev,
        [commentId]: prev[commentId] + (isCurrentlyLiked ? -1 : 1),
      }));

      const response = await fetchAPI("/api/comments/updateCommentLike", {
        method: "PATCH",
        body: JSON.stringify({
          commentId,
          userId: user.id,
          increment: !isCurrentlyLiked,
        }),
      });

      if (response.error) {
        // Revert optimistic update
        setCommentLikes((prev) => ({ ...prev, [commentId]: isCurrentlyLiked }));
        setCommentLikeCounts((prev) => ({
          ...prev,
          [commentId]: prev[commentId] + (isCurrentlyLiked ? 1 : -1),
        }));
        Alert.alert("Error", "Unable to update like status");
        return;
      }

      // Update with server values
      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: response.data.liked,
      }));
      setCommentLikeCounts((prev) => ({
        ...prev,
        [commentId]: response.data.likeCount,
      }));
    } catch (error) {
      console.error("Failed to update comment like:", error);
      // Revert optimistic update on error
      const isCurrentlyLiked = commentLikes[commentId];
      setCommentLikes((prev) => ({ ...prev, [commentId]: isCurrentlyLiked }));
      setCommentLikeCounts((prev) => ({
        ...prev,
        [commentId]: prev[commentId] + (isCurrentlyLiked ? 1 : -1),
      }));
    } finally {
      setIsLoadingCommentLike(false);
    }
  };

  function findUserNickname(
    userArray: UserNicknamePair[],
    userId: string
  ): number {
    const index = userArray.findIndex((pair) => pair[0] === userId);
    return index;
  }

  const fetchNicknames = async () => {
    try {
      // //console.log("user: ", user!.id);
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`, {
        method: "GET",
      });
      if (response.error) {
        //console.log("Error fetching user data");
        //console.log("response data: ", response.data);
        //console.log("response status: ", response.status);
        // //console.log("response: ", response);
        throw new Error(response.error);
      }
      // //console.log("response: ", response.data[0].nicknames);
      const nicknames = response.data[0].nicknames || [];
      setNicknames(nicknames);
      return;
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };
  useEffect(() => {
    fetchNicknames();
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);

    if (!id || !user?.id) {
      console.error("Missing required parameters:", {
        postId: id,
        userId: user?.id,
      });
      setError("Missing required parameters");
      setLoading(false);
      return;
    }

    try {
      const response = await fetchAPI(
        `/api/comments/getComments?postId=${id}&userId=${user.id}`,
        { method: "GET" }
      );

      if (response.error) {
        console.error("API Error:", response.error);
        throw new Error(response.error);
      }

      if (!Array.isArray(response.data)) {
        console.error("Invalid response format:", response);
        throw new Error("Invalid response format");
      }

      // Initialize like states from the response
      interface CommentResponse {
        id: number;
        is_liked: boolean;
        like_count: number;
      }

      const likeStatuses: { [key: number]: boolean } = {};
      const likeCounts: { [key: number]: number } = {};

      (response.data as CommentResponse[]).forEach((comment) => {
        likeStatuses[comment.id] = comment.is_liked || false;
        likeCounts[comment.id] = comment.like_count || 0;
      });

      setPostComments(response.data);
      setCommentLikes(likeStatuses);
      setCommentLikeCounts(likeCounts);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      setError("Failed to fetch comments.");
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    // Prevent submission if already submitting
    if (isSubmitting) {
      return;
    }

    const trimmedComment = newComment.trim();

    if (!trimmedComment || !id || !user?.id || !clerk_id) {
      /*console.log("Missing required data:", { 
          content: trimmedComment, 
          postId: id, 
          clerkId: user?.id,
          postClerkId: clerk_id 
        });*/
      Alert.alert("Error", "Unable to submit comment. Missing required data.");
      return;
    }

    try {
      setIsSubmitting(true); // Start submission
      setNewComment(""); // Clear input immediately to prevent double submission

      const response = await fetchAPI(`/api/comments/newComment`, {
        method: "POST",
        body: JSON.stringify({
          content: trimmedComment,
          postId: id,
          clerkId: user.id,
          postClerkId: clerk_id,
        }),
      });

      if (response.error) {
        console.error("API Error:", response.error);
        throw new Error(response.error);
      }

      // Fetch updated comments with like status
      await fetchComments();
    } catch (error) {
      console.error("Failed to submit comment:", error);
      Alert.alert("Error", "Failed to submit comment. Please try again.");
    } finally {
      setIsSubmitting(false); // End submission regardless of success/failure
    }
  };

  const handleDeletePostPress = async () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel" },
      { text: "Delete", onPress: handleDeletePost },
    ]);
  };

  const handleDeletePost = async () => {
    try {
      setIsPostDeleted(true);

      await fetchAPI(`/api/posts/deletePost?id=${id}`, {
        method: "DELETE",
      });

      Alert.alert("Post deleted.");
      router.back();
    } catch (error) {
      setIsPostDeleted(false);
      Alert.alert("Error deleting post");
    }
  };
  const handleDeleteCommentPress = async (id: number) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel" },
        { text: "Delete", onPress: () => handleDeleteComment(id) },
      ]
    );
  };

  const handleDeleteComment = async (id: number) => {
    try {
      await fetchAPI(`/api/comments/deleteComment?id=${id}`, {
        method: "DELETE",
      });

      Alert.alert("Comment deleted.");
      fetchComments();
    } catch (error) {
      Alert.alert("Error", "Failed to delete comment.");
      console.error("Failed to delete comment:", error);
    }
  };

  const handleUserProfile = async (id: string) => {
    router.push({
      pathname: "/root/profile/[id]",
      params: { id },
    });
  };

  const handleChangeText = (text: string) => {
    if (text.length <= maxCharacters) {
      setNewComment(text);
    } else {
      setNewComment(text.substring(0, maxCharacters));
      Alert.alert(
        "Limit Reached",
        `You can only enter up to ${maxCharacters} characters.`
      );
    }
  };

  const handleSavePost = async (postId: number) => {

     try {
            const updateSavePosts = await fetchAPI(`/api/users/updateUserSavedPosts`, {
                method: "PATCH",
                body: JSON.stringify({
                  clerkId: user?.id,
                  postId: postId,
                })
              })
          }
          catch(error) {
            console.error("Failed to update unread message:", error);
          } 
  }

  useEffect(() => {
    fetchComments();
  }, [id]);

  useEffect(() => {
    navigation.addListener("beforeRemove", (e) => {
      if (Number(unread_comments) > 0) {
        handleReadComments();
      }
      //console.log("User goes back from post screen");
    });
  }, []);

  // before returning user to screen, update unread_comments to 0
  // only if the user is viewing their own post
  const handleReadComments = async () => {
    if (clerk_id === user!.id) {
      try {
        const response = await fetchAPI(`/api/posts/updateUnreadComments`, {
          method: "PATCH",
          body: JSON.stringify({
            clerkId: user?.id,
            postId: id,
            postClerkId: clerk_id,
          }),
        });
      } catch (error) {
        console.error("Failed to update unread comments:", error);
      }
    }
  };

  const handleReportPress = () => {
    Linking.openURL("mailto:support@colore.ca")
  };
  const handleEditing = () => {

      router.push({
            pathname: "/root/edit-post",
            params: { postId: id, content: content, color: color},
                  });
              
  }

  const renderCommentItem = ({
    item,
  }: {
    item: PostComment;
  }): React.ReactElement => {
    // Find the index of the current item in postComments only once
    const itemIndex = postComments.findIndex(comment => comment.id === item.id);
    
    // Conditionally determine the username

    let username = "";
    if (!anonymousComments) {
      username = itemIndex > 0 && postComments[itemIndex - 1].user_id === item.user_id
        ? ""
        : item.username;
    }
  
  
    // Get the like count and fallback to 0 if undefined
    const likeCount = commentLikeCounts[item.id] || 0;

    console.log("username2", username);
  
    return (
      <CommentItem
        id={item.id}
        user_id={item.user_id}
        sender_id={clerk_id}
        post_id={item.post_id}
        username={username}
        like_count={likeCount}
        content={item.content}
        created_at={item.created_at}
        report_count={item.report_count}
        is_liked={commentLikes[item.id]}
        postColor={postColor?.hex}
      />
    );
  };

  console.log("anonymousComments: ", anonymousComments);
  
  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
      
          <KeyboardAvoidingView behavior={"padding"} style={{ flex: 1 }}>
          <View className="flex-1">
            <View className="flex-row items-center ml-6 mt-6">
              <TouchableOpacity onPress={() => router.back()} className="mr-4">
                <AntDesign name="caretleft" size={18} />
              </TouchableOpacity>
            </View>
            <View className="border-b border-gray-200 pb-8 mr-4 ml-6 mt-4 flex flex-row justify-between">
              <View className="flex-1">
                <TouchableOpacity onPress={() => handleUserProfile(userId)}>
                  <Text className="font-JakartaSemiBold text-lg">
                    {anonymous === "true" ? (clerk_id === user!.id ? "Me" : "Anonymous") : (nickname || username || "Anonymous")}
                  </Text>
                </TouchableOpacity>
                <Text className="text-sm text-gray-500">
                  {typeof created_at === "string"
                    ? formatDateTruncatedMonth(
                        convertToLocal(new Date(created_at))
                      )
                    : "No date"}
                </Text>
                <TouchableWithoutFeedback
                onPress={() => Keyboard.dismiss()}
                onPressIn={() => Keyboard.dismiss()}
                >
                      <ScrollView style={{ maxHeight: screenHeight / 6 }} showsVerticalScrollIndicator={false}>
                      <Text className="font-Jakarta min-h-[30]">
                        {content}
                      </Text>
                      </ScrollView>
    
                </TouchableWithoutFeedback>
              </View>
              <View className="flex flex-col items-center ml-4">
                {clerk_id === user?.id ? (
                  <DropdownMenu
                    menuItems={[
                      { label: "Edit", 
                          source: icons.pencil, 
                          color: "#0851DA", 
                          onPress: handleEditing },
                      { label: "Delete", 
                        source: icons.trash, 
                        color: "#DA0808", 
                        onPress: handleDeletePostPress }
                    ]}
                  />
                ) : (
                  <DropdownMenu
                   menuItems={[
                     { 
                    label: "Share", 
                    source: icons.send, 
                    color: "#000000", 
                    onPress: () => {} }, 
                    { label: saved ? "Remove" : "Save", 
                      color: "#000000", 
                      source: icons.bookmark, 
                      onPress: () => handleSavePost(id) }, 
                    { label: "Report", 
                      source: icons.email,
                      color: "#DA0808",  
                      onPress: handleReportPress },]}
                  />
                )}
                <View className="mt-4">  
                  <TouchableOpacity
                    onPress={handleLikePress}
                    disabled={isLoadingLike}
                  >
                    <MaterialCommunityIcons
                      name={isLiked ? "heart" : "heart-outline"}
                      size={24}
                      color={isLiked ? "red" : "black"}
                    />
                  </TouchableOpacity>
                  {/* Only show like count to post creator */}
                  <Text
                    className={`${clerk_id === user?.id ? "text-gray-600" : "text-transparent"} text-center`}
                  >
                    {clerk_id === user?.id ? likeCount : "0"}
                  </Text>
                </View>
              </View>
            </View>
            <View className="flex-1">

              {/* Comment section */}
              <View className="h-full">
                {loading && <ActivityIndicator size="large" color="#0076e3" />}
                {error && <Text className="text-red-500 mx-4">{error}</Text>}
                {!loading && !error && postComments.length === 0 && (
                  <Text className="text-gray-500 mx-4 mt-4 min-h-[30px] pl-2">
                    No messages yet.
                  </Text>
                )}
                {!loading && !error && postComments.length > 0 && (
                  <FlatList
                                ref={flatListRef}
                                data={postComments}
                                renderItem={renderCommentItem}
                                keyExtractor={(item) => item.id as unknown as string}
                                contentContainerStyle={{ padding: 16 }}
                                style={{ flexGrow: 1 }}
                                extraData={postComments}
                                onContentSizeChange={() => {
                                  flatListRef.current?.scrollToEnd({ animated: true });
                                }}
                              />
                )}
              </View>
            </View>

            <View className="flex-row items-center p-4">
              <TextInput
                className="flex-1 border-[1px] border-gray-300 rounded-[20px] px-4 py-3"
                placeholder="Write a something..."
                value={newComment}
                multiline
                scrollEnabled
                onChangeText={handleChangeText}
                onSubmitEditing={isSubmitting ? undefined : handleCommentSubmit}
                editable={!isSubmitting && !isSubmitting}
              />
              <CustomButton
                title={isSubmitting ? "..." : "Send"}
                onPress={handleCommentSubmit}
                disabled={
                  newComment.length === 0 || isSubmitting || isPostDeleted
                }
                className="ml-3 w-14 h-10 rounded-full shadow-none"
                style = {{ backgroundColor: postColor ? postColor.hex : "black"}}
                fontSize="sm"
                padding="0"
              />
            </View>

            </View>
          </KeyboardAvoidingView>
         
      </SignedIn>
    </SafeAreaView>
  );
};

export default PostScreen;

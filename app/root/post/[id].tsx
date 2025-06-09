import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants/index";
import { allColors } from "@/constants/colors";
import { fetchAPI } from "@/lib/fetch";
import { convertToLocal, formatDateTruncatedMonth, getRelativeTime } from "@/lib/utils";
import { PostComment, PostItColor, UserNicknamePair } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { useAlert } from '@/notifications/AlertContext';
import { CommentItem } from "@/components/Comment";
import { useGlobalContext } from "@/app/globalcontext";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects"; // Import sound hook
import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  Dimensions,
  Image,
  FlatList,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";

import { useNavigationContext } from "@/components/NavigationContext";

import React from "react";
import { Ionicons } from "@expo/vector-icons";

interface GestureContext {
  startX: number;
  startY: number;
}

interface PostCommentGroup {
  date: string;
  comments: PostComment[]
}



const PostScreen = ({ id, clerkId }: {id: string, clerkId: string}) => {
  const { user } = useUser();
  const router = useRouter();
  const navigation = useNavigation();
  const { showAlert } = useAlert();
  const {
    clerk_id = "",
    like_count,
    anonymous = "",
    color,
  } = useLocalSearchParams();

  const height = useSharedValue(450);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef(null);
  const [postComments, setPostComments] = useState<PostCommentGroup[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [nicknames, setNicknames] = useState<UserNicknamePair[]>([]);
  const [anonymousComments, setAnonymousComments] = useState<boolean>(
    anonymous === "true"
  );
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
  const userId = clerk_id;
  const screenHeight = Dimensions.get("screen").height;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPostDeleted, setIsPostDeleted] = useState(false);
  const postColor = allColors.find(
    (c) => c.id === color
  ) as PostItColor;
  const { stateVars, setStateVars } = useNavigationContext();
  const { replyTo, setReplyTo, scrollTo, setScrollTo, isIpad, soundEffectsEnabled } = useGlobalContext(); // Add soundEffectsEnabled
  const { playSoundEffect } = useSoundEffects(); // Get sound function
  const [replyView, setReplyView] = useState<PostComment | null>(null);
  const inputRef = useRef(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);




  const fetchCommentById = async (id: string) => {
    try {
      const response = await fetchAPI(`/api/comments/getCommentsById?id=${id}`);

      setReplyView(response.data[0] || null); // Return null if no post is found
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    if (replyTo) {
    fetchCommentById(replyTo)
    } else {
      setReplyView(null)
    }
  }, [replyTo])
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
      setReplyTo(null)
      setReplyView(null)
      return () => {
        setReplyTo(null)
        setStateVars({ ...stateVars, queueRefresh: true});
      }
    }, [])
  );

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

  useEffect(() => {
    scrollToItem()
  }, [scrollTo])

  const scrollToItem = () => {
   // Find the index of the group that contains the target comment
   const groupIndex = postComments.findIndex((p) =>
    p.comments.some(item => item.id.toString() == scrollTo)
  );

  console.log("groupIndex:", groupIndex);

  // Scroll to the group's index if valid
  if (groupIndex !== -1 && flatListRef.current) {
    flatListRef.current.scrollToIndex({ index: groupIndex });
  }
  };

  const fetchComments = async () => {
    //setLoading(true);
    setError(null);
console.log("happend", "id", id)
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
        created_at: string; // Ensure your comments have a created_at field
      }
  
      const likeStatuses: { [key: number]: boolean } = {};
      const likeCounts: { [key: number]: number } = {};
  
      (response.data as CommentResponse[]).forEach((comment) => {
        likeStatuses[comment.id] = comment.is_liked || false;
        likeCounts[comment.id] = comment.like_count || 0;
      });
  
      // Group comments by date
      const groupedComments = response.data.reduce((acc, comment) => {
        const commentDate = new Date(comment.created_at).toDateString(); // Convert to a readable date
        const existingGroup = acc.find(group => group.date === commentDate);
  
        if (existingGroup) {
          existingGroup.comments.push(comment);
        } else {
          acc.push({ date: commentDate, comments: [comment] });
        }
  
        return acc;
      }, [] as { date: string; comments: CommentResponse[] }[]);
  
      setPostComments(groupedComments);
      setCommentLikes(likeStatuses);
      setCommentLikeCounts(likeCounts);} catch (error) {
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

    if (!trimmedComment || !id || !user?.id || !clerkId) {
      /*console.log("Missing required data:", { 
          content: trimmedComment, 
          postId: id, 
          clerkId: user?.id,
          postClerkId: clerk_id 
        });
        */
      showAlert({
        title: 'Error',
        message: `Unable to submit comment. Missing required data.`,
        type: 'ERROR',
        status: 'error',
      });
      return;
    }

    // Play comment sound if enabled
    if (soundEffectsEnabled) {
      playSoundEffect(SoundType.Comment);
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
          postClerkId: clerkId,
          replyId: replyTo ?? null
        }),
      });

      if (response.error) {
        console.error("API Error:", response.error);
        throw new Error(response.error);
      }

      setReplyTo("")
      setReplyView(null)
      // Fetch updated comments with like status
      await fetchComments();
    } catch (error) {
      console.error("Failed to submit comment:", error);
      showAlert({
        title: 'Error',
        message: `Failed to submit comment. Please try again.`,
        type: 'ERROR',
        status: 'error',
      });
    } finally {
      setIsSubmitting(false); // End submission regardless of success/failure
    }
  };


  const handleDeleteComment = async (id: number) => {
    try {
      await fetchAPI(`/api/comments/deleteComment?id=${id}`, {
        method: "DELETE",
      });

      showAlert({
        title: 'Comment deleted.',
        message: `This comment has been deleted.`,
        type: 'DELETE',
        status: 'success',
      });
      fetchComments();
    } catch (error) {
      showAlert({
        title: 'Error',
        message: `An error occured. This comment has not been deleted.`,
        type: 'ERROR',
        status: 'error',
      });
      console.error("Failed to delete comment:", error);
    }
  };


  const handleChangeText = (text: string) => {
    if (text.length <= maxCharacters) {
      setNewComment(text);
    } else {
      setNewComment(text.substring(0, maxCharacters));
      showAlert({
        title: 'Limit Reached',
        message: `You can only enter up to ${maxCharacters} characters.`,
        type: 'ERROR',
        status: 'error',
      });
    }
  };



  useEffect(() => {
    fetchComments();
  }, [id, scrollTo]);

  useEffect(() => {
    if (replyView) {
    setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [replyView])


  const renderCommentItem = ({
    item,
  }: {
    item: { date: string; comments: PostComment[] };
  }): React.ReactElement => {
    // Find the index of the current item in postComments only once

    return (
      <View style={{ marginBottom: 15 }}>
      {/* Show the date as the header */}
      <Text className="text-gray-500 text-center text-[12px]">{
      
      getRelativeTime(item.date)
      
      }</Text>

      {/* Render each comment in the group */}
      {item.comments.map((comment, index) => (
        <CommentItem
          key={comment.id}
          id={comment.id}
          user_id={comment.user_id}
          sender_id={comment.sender_id}
          post_id={comment.post_id}
          index={index}
          username={
            anonymousComments ? "" :
            index > 0 ? (item.comments[index - 1].username == comment.username ? "" : comment.username) : comment.username

          }
          like_count={comment.like_count|| 0}
          content={comment.content}
          created_at={comment.created_at}
          report_count={comment.report_count}
          is_liked={commentLikes[comment.id]}
          postColor={postColor?.hex}
          reply_comment_id={comment.reply_comment_id}
        />
      ))}
    </View>

    );
  };

    useEffect(() => {
    if (keyboardVisible) {
      height.value = withTiming(300, { duration: 500 });
    } else {
      height.value = withTiming(450, { duration: 500 });
    }
    

    
  }, [keyboardVisible]);

 
    const animatedHeightStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View style={[{ flex: 1, paddingHorizontal: 24, paddingVertical: 8 }, animatedHeightStyle]}>

         <Pressable onPress={() => 
                  {
                    Keyboard.dismiss()
                  }
                  } />
        <View className="flex-1">
        
          <View className="flex-1">
            {/* Comment section */}
            <View className="h-full">
              {loading &&  <View className="flex-1 items-center justify-center">
                <ColoreActivityIndicator text="Summoning Bob..." />
                </View>}
              {error && <Text className="text-red-500 mx-4">{error}</Text>}
              {!loading && !error && postComments.length === 0 && (
                <Text className="text-gray-500 mx-4 mt-4 min-h-[30px] pl-2 text-center">
                  No messages yet.
                </Text>
              )}
              {!loading && !error && postComments.length > 0 && (
                <FlatList
                  ref={flatListRef}
                  data={postComments}
                  className="rounded-[20px]"
                  renderItem={renderCommentItem}
                  keyExtractor={(item) => item.date as unknown as string}
                  contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                  style={{ flexGrow: 1 }}
                  extraData={postComments}
                  onContentSizeChange={() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </View>

<View className="flex flex-col">
{replyView && (
  <View className="mt-2 mb-1 ml-2 pl-3 flex-row items-center border-l-2 border-gray-200 max-w-[85%]">
    <Image
    source={icons.chevron}
    className="mr-4 h-4 w-4"
    tintColor={"#9e9e9e"}
    />
    <Text 
      className="text-sm text-gray-500"
      numberOfLines={2}
    >
      {replyView.content}
    </Text>
    <TouchableOpacity 
      onPress={() => setReplyView(null)}
      className="ml-2 p-1"
    >
      <Image
    source={icons.close}
    className="ml-5 h-5 w-5"
    tintColor={"#9e9e9e"}
    />
    </TouchableOpacity>
  </View>
)}
  <View className="relative flex flex-row items-center justify-between bg-white rounded-[32px] px-4 h-[48px] mx-2 mb-2 "
        style={{
          boxShadow: "0 0 7px 1px rgba(180,180,180,.1)"
        }}
        >
          <TextInput
            className="flex-1 pl-2 text-[14px] pr-16 "
             placeholderTextColor="#9CA3AF"
            placeholder="Write a something..."
              value={newComment}
              multiline
              scrollEnabled
              onFocus={() => setKeyboardVisible(true)}
              onBlur={() => setKeyboardVisible(false)}
              onChangeText={handleChangeText}
              onSubmitEditing={isSubmitting ? undefined : handleCommentSubmit}
              editable={!isSubmitting && !isSubmitting}
          />
          <View className="absolute right-1 w-[25%]">
                        <CustomButton
              title={isSubmitting ? "..." : "Send"}
              onPress={handleCommentSubmit}
              disabled={
                newComment.length === 0 || isSubmitting || isPostDeleted
              }
              fontSize="sm"
              padding={3}
            />
          </View>
        </View>
        

          </View>
        </View>
  </Animated.View>
  );
};

export default PostScreen;


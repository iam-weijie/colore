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
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
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

import * as Linking from "expo-linking";
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

  // Add pagination states
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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


  // Scroll to the group's index if valid
  if (groupIndex !== -1 && flatListRef.current) {
    flatListRef.current.scrollToIndex({ index: groupIndex });
  }
  };

  const fetchComments = async (pageNum = 0, append = false) => {
    if (pageNum === 0) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);
    console.log("fetching comments for post", id, "page", pageNum);

    if (!id || !user?.id) {
      console.error("Missing required parameters:", {
        postId: id,
        userId: user?.id,
      });
      setError("Missing required parameters");
      setLoading(false);
      setIsLoadingMore(false);
      return;
    }

    try {
      const response = await fetchAPI(
        `/api/comments/getComments?postId=${id}&userId=${user.id}&page=${pageNum}&limit=25`,
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

      // Update pagination info
      setHasMore(response.pagination?.hasMore || false);
      setPage(pageNum);

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

        // Find existing group or create a new one
        const existingGroup = acc.find(group => group.date === commentDate);

        if (existingGroup) {
          existingGroup.comments.push(comment);
        } else {
          acc.push({
            date: commentDate,
            comments: [comment]
          });
        }

        return acc;
      }, [] as PostCommentGroup[]);

      // Add fetched comments to state
      if (append) {
        // Append new comments to existing ones
        setPostComments(prev => {
          const combinedGroups = [...prev];

          // Merge the new groups with existing ones
          groupedComments.forEach(newGroup => {
            const existingGroupIndex = combinedGroups.findIndex(g => g.date === newGroup.date);

            if (existingGroupIndex >= 0) {
              // Add new comments to existing date group
              combinedGroups[existingGroupIndex].comments.push(...newGroup.comments);
            } else {
              // Add new date group
              combinedGroups.push(newGroup);
            }
          });

          return combinedGroups;
        });
      } else {
        // Replace with new comments
        setPostComments(groupedComments);
      }

      // Update like states
      setCommentLikes(prev => ({ ...prev, ...likeStatuses }));
      setCommentLikeCounts(prev => ({ ...prev, ...likeCounts }));

    } catch (error) {
      console.error("Error fetching comments:", error);
      setError("Failed to load comments. Please try again.");
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Load initial comments
  useEffect(() => {
    if (id && user?.id) {
      fetchComments(0, false);
    }
  }, [id, user?.id]);

  // Function to load more comments when user scrolls
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchComments(page + 1, true);
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

    // Immediately clear the input and prevent further submissions
    setNewComment('');
    setIsSubmitting(true);

    // Create temporary comment for optimistic update
    const tempId = Date.now();

    // Use the same date as the most recent comment group to ensure proper grouping
    let optimisticTimestamp = new Date().toISOString();
    if (postComments.length > 0) {
      // Get the most recent comment from the last group
      const lastGroup = postComments[postComments.length - 1];
      if (lastGroup.comments.length > 0) {
        const lastComment = lastGroup.comments[lastGroup.comments.length - 1];
        // Use a timestamp that's just slightly after the last comment but same day
        const lastCommentDate = new Date(lastComment.created_at);
        const newTimestamp = new Date(lastCommentDate.getTime() + 1000); // Add 1 second
        optimisticTimestamp = newTimestamp.toISOString();
      }
    }

    // Find the username from existing comments by the same user to ensure consistency
    let optimisticUsername = 'Anonymous';

    // First try to find username from existing comments by the same user
    for (const group of postComments) {
      const userComment = group.comments.find(comment => comment.user_id === user.id);
      if (userComment && userComment.username && userComment.username !== 'Anonymous') {
        optimisticUsername = userComment.username;
        break;
      }
    }

    // If no existing comment found, try to get username from database
    if (optimisticUsername === 'Anonymous') {
      try {
        const userResponse = await fetchAPI(`/api/users/getUsername?clerkId=${user.id}`, {
          method: "GET",
        });
        if (userResponse.data && userResponse.data.username) {
          optimisticUsername = userResponse.data.username;
        }
      } catch (error) {
        console.log("Could not fetch username from database, using Anonymous");
      }
    }

    const tempComment: PostComment = {
      id: tempId, // Temporary ID that we'll keep stable
      post_id: parseInt(id as string),
      user_id: user.id,
      sender_id: user.id,
      content: trimmedComment,
      username: optimisticUsername,
      created_at: optimisticTimestamp,
      like_count: 0,
      report_count: 0,
      is_liked: false,
      index: 0, // Will be updated
      postColor: postColor?.hex || '#000000',
      reply_comment_id: replyView?.id || null
    };

    try {
      // Optimistically add the comment to UI immediately
      console.log("📝 Adding optimistic comment to main post view:", tempComment);
      setPostComments(prev => {
        // Always add to the last (most recent) group if it exists, or create a new one
        if (prev.length > 0) {
          // Add to the last group (most recent date group)
          const updatedGroups = [...prev];
          const lastGroup = updatedGroups[updatedGroups.length - 1];
          lastGroup.comments.push(tempComment);
          return updatedGroups;
        } else {
          // Create new group if no groups exist
          const today = new Date().toDateString();
          return [{ date: today, comments: [tempComment] }];
        }
      });

      // Reset reply view
      setReplyView(null);
      setReplyTo("");

      // Scroll to bottom to show the new comment
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);

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

      // Don't update the ID to keep the key stable and prevent double animation
      // The temporary ID will work fine for the UI, and the real ID isn't needed for display
      console.log("✅ Comment successfully saved to server with ID:", response.data.id);
    } catch (error) {
      console.error("Failed to submit comment:", error);

      // Remove the optimistic comment on error
      setPostComments(prev =>
        prev.map(group => ({
          ...group,
          comments: group.comments.filter(comment => comment.id !== tempComment.id)
        })).filter(group => group.comments.length > 0) // Remove empty groups
      );

      // Restore the comment text
      setNewComment(trimmedComment);

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

  // Update the renderFooter to show loading indicator when loading more comments
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ColoreActivityIndicator />
      </View>
    );
  };

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
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={renderFooter}
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
          boxShadow: "0 0 7px 1px rgba(150,150,150,.15)"
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
              bgVariant={newComment.length === 0 || isSubmitting || isPostDeleted ? "gradient2" : undefined}
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


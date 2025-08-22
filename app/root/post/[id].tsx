import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants/index";
import { allColors } from "@/constants/colors";
import { fetchAPI } from "@/lib/fetch";
import { getRelativeTime } from "@/lib/utils";
import { PostComment, PostItColor, UserNicknamePair } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { useAlert } from '@/notifications/AlertContext';
import { CommentItem } from "@/components/Comment";
import { useReplyScroll } from "@/app/contexts/ReplyScrollContext";
import { useDevice } from "@/app/contexts/DeviceContext";
import { useSettingsContext } from "@/app/contexts/SettingsContext";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects"; // Import sound hook
import {
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import Animated from 'react-native-reanimated';
import {
  Dimensions,
  FlatList,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Platform,
  KeyboardAvoidingView
} from "react-native";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import { useNavigationContext } from "@/components/NavigationContext";
import EmptyListView from "@/components/EmptyList";
import {
  fetchLikeStatus,
} from "@/lib/post";
import React from "react";

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef(null);
  const [postComments, setPostComments] = useState<PostCommentGroup[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [anonymousComments, setAnonymousComments] = useState<boolean>(
    anonymous === "true"
  );
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(
    typeof like_count === "string" ? parseInt(like_count) : 0
  );
  const [commentLikes, setCommentLikes] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [commentLikeCounts, setCommentLikeCounts] = useState<{
    [key: string]: number;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const postColor = allColors.find(
    (c) => c.id === color
  ) as PostItColor;
  const { stateVars, setStateVars } = useNavigationContext();
  const { replyTo, setReplyTo, scrollTo, setScrollTo } = useReplyScroll();
  const { soundEffectsEnabled } = useSettingsContext();
  const { playSoundEffect } = useSoundEffects(); // Get sound function
  const [replyView, setReplyView] = useState<PostComment | null>(null);
  const inputRef = useRef(null);

  // Add pagination states
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // --- START NEW LOGIC ---

  // Handler function for replying to a comment
  const handleReplyComment = useCallback((comment: PostComment) => {
    setReplyTo(comment.id.toString());
    setReplyView(comment);
    setTimeout(() => {
      // Focus the input to bring up the keyboard
      inputRef.current?.focus();
    }, 100);
  }, []);

  // Handler function for deleting a comment
  const handleDeleteComment = useCallback(async (commentId: number) => {
    try {
      // Optimistic UI update: remove the comment immediately
      const originalComments = postComments;
      setPostComments(prev =>
        prev.map(group => ({
          ...group,
          comments: group.comments.filter(comment => comment.id !== commentId)
        })).filter(group => group.comments.length > 0)
      );
      
      const response = await fetchAPI(`/api/comments/delete`, {
        method: "DELETE",
        body: JSON.stringify({ commentId: commentId }),
      });

      if (response.error) {
        throw new Error(response.error);
      }
      
      showAlert({
        title: "Success",
        message: "Comment deleted successfully!",
        type: "SUCCESS",
        status: "success",
      });

    } catch (error) {
      console.error("Failed to delete comment:", error);
      // Rollback the optimistic update on error
      setPostComments(originalComments);
      showAlert({
        title: "Error",
        message: "Failed to delete comment. Please try again.",
        type: "ERROR",
        status: "error",
      });
    }
  }, [postComments, showAlert]);
  
  // --- END NEW LOGIC ---

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
    const fetchLikesForPost = async () => {
      if (!id || !user?.id) return;
      try {
        const status = await fetchLikeStatus(parseInt(id), user.id);
        setIsLiked(status.isLiked);
        setLikeCount(status.likeCount);
      } catch (error) {
        console.error("Failed to fetch like status:", error);
      }
    };
    fetchLikesForPost();
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

    if (!id || !user?.id) {
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
        throw new Error(response.error);
      }

      if (!Array.isArray(response.data)) {
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
        throw new Error(response.error);
      }
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

  const handleChangeText = (text: string) => {
    const maxCharacters = 6000;
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
          username={anonymousComments ? "" :
            index > 0 ? (item.comments[index - 1].username == comment.username ? "" : comment.username) : comment.username}
          like_count={comment.like_count || 0}
          content={comment.content}
          created_at={comment.created_at}
          report_count={comment.report_count}
          is_liked={commentLikes[comment.id]}
          postColor={postColor?.hex}
          reply_comment_id={comment.reply_comment_id} 
          nickname={""} 
          incognito_name={""}
          // The new props your CommentItem needs to enable the reply and delete functionality.
          // You will need to update your CommentItem component to use these props.
          onReply={() => handleReplyComment(comment)}
          onDelete={() => handleDeleteComment(comment.id)}
          currentUserId={user?.id}
        />
      ))}
    </View>
    );
  };

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
    <KeyboardAvoidingView 
      keyboardVerticalOffset={64}
      style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 8, minHeight: 500 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
        <Pressable onPress={() => { Keyboard.dismiss() }} />
        <View className="flex-1">
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
              ListEmptyComponent={
              <EmptyListView message={"Be the first to comment."} character="bob" mood={0} />
            }
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
                onFocus={() => {}} // Removed unused state
                onBlur={() => {}} // Removed unused state
                onChangeText={handleChangeText}
                onSubmitEditing={isSubmitting ? undefined : handleCommentSubmit}
                editable={!isSubmitting}
            />
            <View className="absolute right-1 w-[25%]">
                          <CustomButton
                title={isSubmitting ? "..." : "Send"}
                onPress={handleCommentSubmit}
                disabled={
                  newComment.length === 0 || isSubmitting
                }
                fontSize="sm"
                bgVariant={newComment.length === 0 || isSubmitting ? "gradient2" : undefined}
                padding={3}
              />
            </View>
          </View>
        </View>
    </KeyboardAvoidingView>
  );
};

export default PostScreen;
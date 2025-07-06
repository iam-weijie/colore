import { View, Text, StyleSheet, FlatList, TextInput, Platform, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Image, SafeAreaView, Dimensions } from 'react-native';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { fetchAPI } from '@/lib/fetch';
import { useUser } from '@clerk/clerk-expo';
import { useAlert } from '@/notifications/AlertContext';
import { useReplyScroll } from '@/app/contexts/ReplyScrollContext';
import { useSettingsContext } from '@/app/contexts/SettingsContext';
import { useSoundEffects, SoundType } from '@/hooks/useSoundEffects';
import { temporaryColors, icons } from '@/constants';
import { getRelativeTime } from '@/lib/utils';
import CustomButton from '@/components/CustomButton';
import ColoreActivityIndicator from '@/components/ColoreActivityIndicator';
import { CommentItem } from '@/components/Comment';
import { PostComment } from '@/types/type';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  TapGestureHandler,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

// Define the PostCommentGroup interface
interface PostCommentGroup {
  date: string;
  comments: PostComment[];
}

const PostCommentsModal = () => {
  const { id, clerkId, colorName, anonymous } = useLocalSearchParams();
  const { user } = useUser();
  const { showAlert } = useAlert();
  const { replyTo, setReplyTo, scrollTo, setScrollTo } = useReplyScroll();
  const { soundEffectsEnabled } = useSettingsContext();
  const { playSoundEffect } = useSoundEffects();

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allComments, setAllComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [anonymousComments, setAnonymousComments] = useState<boolean>(
    anonymous === "true"
  );
  const [commentLikes, setCommentLikes] = useState<{ [key: string]: boolean }>({});
  const [commentLikeCounts, setCommentLikeCounts] = useState<{
    [key: string]: number;
  }>({});
  const [replyView, setReplyView] = useState<PostComment | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Pagination
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Constants
  const maxCharacters = 6000;
  const postColor = temporaryColors.find(c => c.name === colorName);
  const screenHeight = Dimensions.get('window').height;
  const minModalHeight = screenHeight * 0.5; // Default 50% of screen
  const maxModalHeight = screenHeight * 0.95; // Maximum 95% of screen

  // Animated values for draggable modal
  const translateY = useSharedValue(0);
  const modalHeight = useSharedValue(minModalHeight);
  const isExpanded = useSharedValue(false);

  // Use useMemo to group comments by date
  const groupedComments = useMemo(() => {
    return allComments.reduce((groups: PostCommentGroup[], comment: PostComment) => {
      // Use toDateString() for consistent date grouping (same as main post component)
      const date = new Date(comment.created_at).toDateString();

      const existingGroup = groups.find(group => group.date === date);
      if (existingGroup) {
        existingGroup.comments.push(comment);
      } else {
        groups.push({ date, comments: [comment] });
      }

      return groups;
    }, []);
  }, [allComments]);

  // Fetch comment by ID for reply functionality - memoized
  const fetchCommentById = useCallback(async (commentId: string) => {
    try {
      const response = await fetchAPI(`/api/comments/getCommentsById?id=${commentId}`);
      setReplyView(response.data[0] || null);
    } catch (error) {
      console.error("Error fetching comment by ID:", error);
      return null;
    }
  }, []);

  // Update reply view when replyTo changes
  useEffect(() => {
    if (replyTo) {
      fetchCommentById(replyTo);
    } else {
      setReplyView(null);
    }
  }, [replyTo, fetchCommentById]);

  // Focus on input when replying
  useEffect(() => {
    if (replyView) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [replyView]);

  // Also focus when replyTo is set (for immediate responsiveness)
  useEffect(() => {
    if (replyTo) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [replyTo]);

  // Scroll to specific comment when scrollTo changes
  useEffect(() => {
    if (scrollTo) {
      scrollToComment();
    }
  }, [scrollTo, groupedComments]);

  const scrollToComment = useCallback(() => {
    if (!scrollTo || !flatListRef.current) return;

    // Add a small delay to ensure FlatList is fully rendered
    setTimeout(() => {
      if (!flatListRef.current) return;

      // Find the group index that contains the target comment
      const groupIndex = groupedComments.findIndex((group) =>
        group.comments.some(comment => comment.id.toString() === scrollTo)
      );

      if (groupIndex !== -1) {
        try {
          // Scroll to the group and position it at the top
          flatListRef.current.scrollToIndex({ 
            index: groupIndex, 
            animated: true,
            viewPosition: 0 // 0 = top, 0.5 = center, 1 = bottom
          });
        } catch (error) {
          // Fallback to manual scroll
          try {
            flatListRef.current.scrollToEnd({ animated: true });
          } catch (fallbackError) {
            // Silent error handling for scroll operations
          }
        }
      }
    }, 100);
  }, [scrollTo, groupedComments]);

  // Fetch comments - memoized
  const fetchComments = useCallback(async (pageNum = 0, isLoadMore = false) => {
    if (isLoadingMore || !id || !user?.id) return;

    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetchAPI(
        `/api/comments/getCommentsByPostId?postId=${id}&userId=${user.id}&page=${pageNum}`
      );

      if (response.error) {
        throw new Error(response.error);
      }

      // Process comments data
      const { comments, hasMore: moreAvailable, likeStatuses, likeCounts } = response.data;

      setHasMore(moreAvailable);
      setPage(pageNum);

      // Update allComments
      if (isLoadMore) {
        setAllComments(prev => [...prev, ...comments]);
      } else {
        setAllComments(comments);
      }

      // Update like states
      setCommentLikes(prev => ({ ...prev, ...likeStatuses }));
      setCommentLikeCounts(prev => ({ ...prev, ...likeCounts }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      setError("Failed to load comments. Please try again.");
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [id, user?.id, isLoadingMore]);

  // Load initial comments
  useEffect(() => {
    if (id && user?.id) {
      fetchComments(0, false);
    }
  }, [id, user?.id, fetchComments]);

  // Keyboard event listeners for dynamic positioning
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        
        // Auto-collapse modal when keyboard opens if expanded
        if (isExpanded.value) {
          modalHeight.value = withSpring(minModalHeight, {
            damping: 25,
            stiffness: 400,
          });
          isExpanded.value = false;
        }
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Load more comments when user scrolls - memoized
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchComments(page + 1, true);
    }
  }, [isLoadingMore, hasMore, page, fetchComments]);

  // Handle comment submission
  const handleCommentSubmit = async () => {
    if (isSubmitting) return;

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
    const tempId = -(Date.now() % 1000000); // Negative number to avoid conflicts, smaller range

    // Use the same date as the most recent comment to ensure proper grouping
    let optimisticTimestamp = new Date().toISOString();
    if (allComments.length > 0) {
      // Get the most recent comment
      const lastComment = allComments[allComments.length - 1];
      // Use a timestamp that's just slightly after the last comment but same day
      const lastCommentDate = new Date(lastComment.created_at);
      const newTimestamp = new Date(lastCommentDate.getTime() + 1000); // Add 1 second
      optimisticTimestamp = newTimestamp.toISOString();
    }

    // Find the username from existing comments by the same user to ensure consistency
    let optimisticUsername = 'Anonymous';

    // First try to find username from existing comments by the same user
    const userComment = allComments.find(comment => comment.user_id === user.id);
    if (userComment && userComment.username && userComment.username !== 'Anonymous') {
      optimisticUsername = userComment.username;
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
      nickname: optimisticUsername,
      incognito_name: optimisticUsername,
      created_at: optimisticTimestamp,
      like_count: 0,
      report_count: 0,
      is_liked: false,
      index: allComments.length,
      postColor: postColor?.hex || '#000000',
      reply_comment_id: replyView?.id || null
    };

    try {
      // Optimistically add the comment to UI immediately
      // Always add to the end since comments are ordered by created_at ASC
      setAllComments(prev => [...prev, tempComment]);

      // Reset reply view
      setReplyView(null);
      setReplyTo(null);

      // Scroll to bottom to show the new comment
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);

      // Make the actual API call
      const response = await fetchAPI("/api/comments/newComment", {
        method: "POST",
        body: JSON.stringify({
          clerkId: user.id,
          postId: id,
          postClerkId: clerkId,
          content: trimmedComment,
          replyId: replyView?.id || null
        }),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Update the temporary comment with the real ID from server
      const realId = response.data.id;
      setAllComments(prev => 
        prev.map(comment => 
          comment.id === tempComment.id 
            ? { ...comment, id: realId }
            : comment
        )
      );

    } catch (error) {
      console.error("Failed to submit comment:", error);

      // Remove the optimistic comment on error
      setAllComments(prev => prev.filter(comment => comment.id !== tempComment.id));

      // Restore the comment text
      setNewComment(trimmedComment);

      showAlert({
        title: 'Error',
        message: `An error occurred. Your comment was not sent.`,
        type: 'ERROR',
        status: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle comment deletion - memoized
  const handleDeleteComment = useCallback((commentId: number) => {
    setAllComments(prev => prev.filter(comment => comment.id !== commentId));
  }, []);

  // Handle text input - memoized
  const handleChangeText = useCallback((text: string) => {
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
  }, [maxCharacters, showAlert]);

  // Tap gesture handler for double-tap to toggle
  const tapHandler = useCallback(() => {
    'worklet';
    if (isExpanded.value) {
      // Collapse
      modalHeight.value = withSpring(minModalHeight, {
        damping: 25,
        stiffness: 400,
      });
      isExpanded.value = false;
    } else {
      // Expand
      modalHeight.value = withSpring(maxModalHeight, {
        damping: 25,
        stiffness: 400,
      });
      isExpanded.value = true;
    }
  }, [minModalHeight, maxModalHeight]);
  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { startHeight: number }>({
    onStart: (_, context) => {
      'worklet';
      // Store the initial height when drag starts
      context.startHeight = modalHeight.value;
    },
    onActive: (event, context) => {
      'worklet';
      const deltaY = event.translationY;
      
      // Calculate new height based on initial position + drag distance
      // Negative deltaY = dragging up (expand), positive deltaY = dragging down (contract)
      const newHeight = context.startHeight - deltaY;
      
      // Clamp the height between min and max values
      modalHeight.value = Math.max(minModalHeight, Math.min(maxModalHeight, newHeight));
      
      // Update expanded state based on current height
      const midPoint = (minModalHeight + maxModalHeight) / 2;
      isExpanded.value = modalHeight.value > midPoint;
      
      // Small visual translation for feedback
      translateY.value = deltaY * 0.05;
    },
    onEnd: (event, context) => {
      'worklet';
      const deltaY = event.translationY;
      const velocity = event.velocityY;
      const finalHeight = context.startHeight - deltaY;
      
      // Determine final state based on gesture and velocity
      const midPoint = (minModalHeight + maxModalHeight) / 2;
      let shouldExpand = false;
      
      // If velocity is strong enough, use velocity to determine direction
      if (Math.abs(velocity) > 300) {
        shouldExpand = velocity < 0; // Negative velocity = upward swipe
      } else {
        // Otherwise, use position relative to midpoint
        shouldExpand = finalHeight > midPoint;
      }
      
      // Animate to final state
      if (shouldExpand) {
        modalHeight.value = withSpring(maxModalHeight, { damping: 20, stiffness: 300 });
        isExpanded.value = true;
      } else {
        modalHeight.value = withSpring(minModalHeight, { damping: 20, stiffness: 300 });
        isExpanded.value = false;
      }
      
      // Reset visual translation
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    },
  });

  // Animated style for the modal container
  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: modalHeight.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Animated style for the drag handle with improved visual feedback
  const animatedHandleStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(0.8, { duration: 150 }),
      transform: [
        { 
          scale: withTiming(1, { duration: 150 })
        }
      ],
    };
  });

  // Render comment item for FlatList - memoized
  const renderCommentItem = useCallback(({
    item,
  }: {
    item: { date: string; comments: PostComment[] };
  }): React.ReactElement => {
    return (
      <View style={styles.commentGroup}>
        <Text style={styles.dateHeader}>
          {getRelativeTime(item.date)}
        </Text>

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
            nickname={comment.nickname || comment.username}
            incognito_name={comment.incognito_name || comment.username}
            like_count={comment.like_count || 0}
            content={comment.content}
            created_at={comment.created_at}
            report_count={comment.report_count}
            is_liked={commentLikes[comment.id]}
            postColor={postColor?.hex || '#000000'}
            reply_comment_id={comment.reply_comment_id || null}
            onDelete={handleDeleteComment}
          />
        ))}
      </View>
    );
  }, [anonymousComments, commentLikes, postColor?.hex, handleDeleteComment]);

  // Loading indicator for pagination - memoized
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ColoreActivityIndicator />
      </View>
    );
  }, [isLoadingMore]);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'Comments',
          headerTintColor: postColor?.fontColor || '#000',
          presentation: 'modal',
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.modalContent, animatedContainerStyle]}>
          {/* Draggable Handle */}
          <PanGestureHandler 
            onGestureEvent={gestureHandler}
            activeOffsetY={[-3, 3]}
          >
            <Animated.View style={[styles.dragHandle, animatedHandleStyle]}>
              <View style={styles.dragIndicator} />
              <Text style={styles.dragText}>Drag to resize</Text>
            </Animated.View>
          </PanGestureHandler>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.commentsContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ColoreActivityIndicator text="Loading comments..." />
                </View>
              ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : groupedComments.length === 0 ? (
                <Text style={styles.emptyText}>
                  No comments yet. Be the first to comment!
                </Text>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={groupedComments}
                  renderItem={renderCommentItem}
                  keyExtractor={(item) => item.date}
                  contentContainerStyle={styles.commentsList}
                  style={styles.commentsListView}
                  showsVerticalScrollIndicator={false}
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.2}
                  ListFooterComponent={renderFooter}
                  initialNumToRender={8}
                  maxToRenderPerBatch={5}
                  windowSize={10}
                  removeClippedSubviews={Platform.OS === 'android'}
                  getItemLayout={undefined} // Disable for better scroll performance with variable heights
                  updateCellsBatchingPeriod={50}
                  maintainVisibleContentPosition={{
                    minIndexForVisible: 0,
                    autoscrollToTopThreshold: 10
                  }}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
          
          <View style={[styles.inputContainer, { 
            bottom: keyboardHeight > 0 ? keyboardHeight : 0,
          }]}>
            {replyView && (
              <View style={styles.replyContainer}>
                <Image
                  source={icons.chevron}
                  style={styles.replyIcon}
                  tintColor={"#9e9e9e"}
                />
                <Text
                  style={styles.replyText}
                  numberOfLines={2}
                >
                  {replyView.content}
                </Text>
              </View>
            )}
            
            {replyView && (
              <TouchableOpacity
                onPress={() => {
                  setReplyView(null);
                  setReplyTo(null);
                }}
                style={styles.closeButtonAbsolute}
              >
                <Image
                  source={icons.close}
                  style={styles.closeIcon}
                  tintColor={"#9e9e9e"}
                />
              </TouchableOpacity>
            )}

            <View style={styles.textInputRow}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder="Write a comment..."
                value={newComment}
                multiline
                scrollEnabled
                onChangeText={handleChangeText}
                editable={!isSubmitting}
              />
              <CustomButton
                title={isSubmitting ? "..." : "Send"}
                onPress={handleCommentSubmit}
                disabled={newComment.length === 0 || isSubmitting}
                className="ml-3 w-14 h-10 rounded-full shadow-none"
                style={{ backgroundColor: postColor ? postColor.hex : "#000" }}
                fontSize="sm"
                padding={0}
              />
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    flex: 1,
    padding: 16,
    paddingTop: 8, // Reduced top padding for drag handle
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 16, // Increased for better touch target
    paddingBottom: 20,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginHorizontal: -16, // Extend to edges of modal
    marginTop: -8, // Compensate for reduced top padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 60, // Ensure minimum touch target size
  },
  dragIndicator: {
    width: 48,
    height: 5,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dragText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  keyboardAvoid: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 16,
  },
  commentsContainer: {
    flex: 1,
    marginBottom: 80, // Fixed space for input container
    marginTop: 8, // Space below drag handle
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 16,
  },
  emptyText: {
    color: '#777',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  commentsList: {
    paddingVertical: 12,
  },
  commentsListView: {
    flex: 1,
  },
  commentGroup: {
    marginBottom: 16,
  },
  dateHeader: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingMoreContainer: {
    paddingVertical: 16,
  },
  inputContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 0,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 12,
    paddingRight: 40,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
  },
  replyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 40, // Leave space for fixed button
    flex: 1,
  },
  replyIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  replyText: {
    flex: 1,
    fontSize: 14,
    color: '#777',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonAbsolute: {
    position: 'absolute',
    top: 4,
    right: 16, // Position relative to inputContainer
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  closeButtonOverlay: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    zIndex: 999, // Very high z-index to ensure it's always on top
  },
  closeIcon: {
    width: 16,
    height: 16,
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 120,
    minHeight: 40,
  },
});

export default PostCommentsModal;
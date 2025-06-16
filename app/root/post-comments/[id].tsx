import { View, Text, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Image, SafeAreaView } from 'react-native';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { fetchAPI } from '@/lib/fetch';
import { useUser } from '@clerk/clerk-expo';
import { useAlert } from '@/notifications/AlertContext';
import { useGlobalContext } from '@/app/globalcontext';
import { useSoundEffects, SoundType } from '@/hooks/useSoundEffects';
import { temporaryColors, icons } from '@/constants';
import { getRelativeTime } from '@/lib/utils';
import CustomButton from '@/components/CustomButton';
import ColoreActivityIndicator from '@/components/ColoreActivityIndicator';
import { CommentItem } from '@/components/Comment';
import { PostComment } from '@/types/type';
import EmptyListView from '@/components/EmptyList';

// Define the PostCommentGroup interface
interface PostCommentGroup {
  date: string;
  comments: PostComment[];
}

const PostCommentsModal = () => {
  const { id, clerkId, colorName, anonymous } = useLocalSearchParams();
  const { user } = useUser();
  const navigation = useNavigation();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { replyTo, setReplyTo, soundEffectsEnabled } = useGlobalContext();
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

  // Fetch comment by ID for reply functionality
  const fetchCommentById = async (commentId: string) => {
    try {
      const response = await fetchAPI(`/api/comments/getCommentsById?id=${commentId}`);
      setReplyView(response.data[0] || null);
    } catch (error) {
      console.error("Error fetching comment by ID:", error);
      return null;
    }
  };

  // Update reply view when replyTo changes
  useEffect(() => {
    if (replyTo) {
      fetchCommentById(replyTo);
    } else {
      setReplyView(null);
    }
  }, [replyTo]);

  // Focus on input when replying
  useEffect(() => {
    if (replyView) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [replyView]);

  // Fetch comments
  const fetchComments = async (pageNum = 0, isLoadMore = false) => {
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
  };

  // Load initial comments
  useEffect(() => {
    if (id && user?.id) {
      fetchComments(0, false);
    }
  }, [id, user?.id]);

  // Load more comments when user scrolls
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      console.log("Loading more comments: page", page + 1);
      fetchComments(page + 1, true);
    }
  };

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
    const tempId = Date.now();

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

      // Don't update the ID to keep the key stable and prevent double animation
      // The temporary ID will work fine for the UI, and the real ID isn't needed for display
      console.log("✅ Comment successfully saved to server with ID:", response.data.id);

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

  // Handle text input
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

  // Render comment item for FlatList
  const renderCommentItem = ({
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
            like_count={comment.like_count || 0}
            content={comment.content}
            created_at={comment.created_at}
            report_count={comment.report_count}
            is_liked={commentLikes[comment.id]}
            postColor={postColor?.hex || '#000000'}
            reply_comment_id={comment.reply_comment_id || null}
          />
        ))}
      </View>
    );
  };

  // Loading indicator for pagination
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ColoreActivityIndicator />
      </View>
    );
  };

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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={90}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.innerContainer}>
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
                  keyExtractor={(item) => item.date || Date.now().toString()}
                  contentContainerStyle={styles.commentsList}
                  style={styles.commentsListView}
                  showsVerticalScrollIndicator={false}
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.2}
                  ListFooterComponent={renderFooter}
                  ListEmptyComponent={
                  <EmptyListView message={"Be the first to comment."} character="bob" mood={0} />
                }
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  removeClippedSubviews={Platform.OS === 'android'}
                />
              )}

              <View style={styles.inputContainer}>
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
                    <TouchableOpacity
                      onPress={() => {
                        setReplyView(null);
                        setReplyTo(null);
                      }}
                      style={styles.closeButton}
                    >
                      <Image
                        source={icons.close}
                        style={styles.closeIcon}
                        tintColor={"#9e9e9e"}
                      />
                    </TouchableOpacity>
                  </View>
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
                    padding="0"
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoid: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 16,
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
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
    maxWidth: '95%',
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
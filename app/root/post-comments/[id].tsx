import { View, Text, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Image, SafeAreaView } from 'react-native';
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [postComments, setPostComments] = useState<PostCommentGroup[]>([]);
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
      
      // Group comments by date
      const groupedComments = comments.reduce((groups: PostCommentGroup[], comment: PostComment) => {
        const date = new Date(comment.created_at).toLocaleDateString();
        
        const existingGroup = groups.find(group => group.date === date);
        if (existingGroup) {
          existingGroup.comments.push(comment);
        } else {
          groups.push({ date, comments: [comment] });
        }
        
        return groups;
      }, []);
      
      if (isLoadMore) {
        setPostComments(prev => [...prev, ...groupedComments]);
      } else {
        setPostComments(groupedComments);
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

    try {
      setIsSubmitting(true);
      setNewComment(''); 

      const postData = {
        content: trimmedComment,
        postId: id,
        clerkId: user.id,
        postClerkId: clerkId,
        replyCommentId: replyView?.id || null,
        isAnonymous: anonymousComments,
      };

      const response = await fetchAPI("/api/comments/createComment", {
        method: "POST",
        body: JSON.stringify(postData),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setReplyView(null);
      setReplyTo(null);
      fetchComments(0, false);
    } catch (error) {
      console.error("Failed to submit comment:", error);
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
            postColor={postColor?.hex}
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
              ) : postComments.length === 0 ? (
                <Text style={styles.emptyText}>
                  No comments yet. Be the first to comment!
                </Text>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={postComments}
                  renderItem={renderCommentItem}
                  keyExtractor={(item) => item.date || Date.now().toString()}
                  contentContainerStyle={styles.commentsList}
                  style={styles.commentsListView}
                  showsVerticalScrollIndicator={false}
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.2}
                  ListFooterComponent={renderFooter}
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
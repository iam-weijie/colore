import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useUser } from "@clerk/clerk-expo";

import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";
import { allColors } from "@/constants/colors";
import { fetchAPI } from "@/lib/fetch";
import { getRelativeTime } from "@/lib/utils";
import { PostComment, PostItColor } from "@/types/type";
import { useAlert } from "@/notifications/AlertContext";
import { CommentItem } from "@/components/Comment";
import { useReplyScroll } from "@/app/contexts/ReplyScrollContext";
import { useSettingsContext } from "@/app/contexts/SettingsContext";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import EmptyListView from "@/components/EmptyList";
import { fetchLikeStatus } from "@/lib/post";
import { useNavigationContext } from "@/components/NavigationContext";

interface PostCommentGroup {
  date: string; // day key
  comments: PostComment[];
}

const isIOS = Platform.OS === "ios";

const normalizeDayKey = (isoLike: string) => {
  const d = new Date(isoLike);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  return new Date(Date.UTC(y, m, day)).toISOString(); // stable key
};

const CommentView = ({ id, clerkId, likes = 0, anonymousParam = true, color = "pink" }: { id: string; clerkId: string, likes: number | string, anonymousParam: boolean, color: string}) => {
  const { user } = useUser();
  const { showAlert } = useAlert();

  const postColor = allColors.find((c) => c.id === color) as PostItColor | undefined;

  // UI & data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<PostCommentGroup[]>([]);
  const [anonymousComments, setAnonymousComments] = useState<boolean>(anonymousParam);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");

  // likes
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(
    typeof likes === "string" ? parseInt(likes) : 0
  );
  const [commentLikes, setCommentLikes] = useState<Record<number, boolean>>({});
  const [commentLikeCounts, setCommentLikeCounts] = useState<Record<number, number>>({});

  // reply state
  const { replyTo, setReplyTo } = useReplyScroll();
  const [replyView, setReplyView] = useState<PostComment | null>(null);

  // nav shared
  const { stateVars, setStateVars } = useNavigationContext();

  // sounds
  const { soundEffectsEnabled } = useSettingsContext();
  const { playSoundEffect } = useSoundEffects();

  // refs
  const flatListRef = useRef<FlatList<PostCommentGroup>>(null);
  const inputRef = useRef<TextInput>(null);

  // paging
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // structural remount key
  const [listVersion, setListVersion] = useState(0);
  const bumpList = () => setListVersion((v) => v + 1);

  // rollback snapshot
  const prevCommentsRef = useRef<PostCommentGroup[]>([]);

  // only autoscroll if the user is near the bottom
  const nearBottomRef = useRef(true);
  const BOTTOM_THRESHOLD = 120; // px from end to consider "near bottom"
  const [autoScrollNextSizeChange, setAutoScrollNextSizeChange] = useState(false);

  // autoscroll helpers
  const scrollToBottom = (animated = true) =>
    requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated }));

  const armAutoScroll = () => {
    if (nearBottomRef.current) setAutoScrollNextSizeChange(true);
  };

  // after first load (or any structural refresh) — jump to bottom once
  useEffect(() => {
    if (!loading && postComments.length) armAutoScroll();
  }, [loading, listVersion]); // fires when your data is first painted

  // optional: when keyboard opens, keep the last message visible
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => armAutoScroll());
    return () => sub.remove();
  }, []);



  // ---- effects: post likes ----
  useEffect(() => {
    const run = async () => {
      if (!id || !user?.id) return;
      try {
        const status = await fetchLikeStatus(parseInt(id as string, 10), user.id);
        setIsLiked(status.isLiked);
        setLikeCount(status.likeCount);
      } catch {}
    };
    run();
  }, [id, user?.id]);

  // ---- effects: focus handling ----
  useFocusEffect(
    useCallback(() => {
      setAnonymousComments(anonymousParam);
      setReplyTo(null);
      setReplyView(null);
      return () => {
        setReplyTo(null);
        setStateVars({ ...stateVars, queueRefresh: true });
      };
    }, [])
  );

  // ---- fetch helpers ----
  const fetchCommentById = async (cid: string) => {
    try {
      const res = await fetchAPI(`/api/comments/getCommentsById?id=${cid}`);
      setReplyView(res?.data?.[0] || null);
    } catch {
      setReplyView(null);
    }
  };

  useEffect(() => {
    if (replyTo) fetchCommentById(replyTo);
    else setReplyView(null);
  }, [replyTo]);

  const groupAndSort = (rows: PostComment[]) => {
    const buckets: Record<string, PostComment[]> = {};
    for (const c of rows) {
      const key = normalizeDayKey(c.created_at);
      (buckets[key] ||= []).push(c);
    }
    const groups: PostCommentGroup[] = Object.keys(buckets)
      .sort()
      .map((k) => ({
        date: k,
        comments: buckets[k].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      }));
    return groups;
  };

  const mergeGroups = (prev: PostCommentGroup[], next: PostCommentGroup[]) => {
    const merged: PostCommentGroup[] = JSON.parse(JSON.stringify(prev));
    for (const ng of next) {
      const idx = merged.findIndex((g) => g.date === ng.date);
      if (idx >= 0) {
        const existingIds = new Set(merged[idx].comments.map((c) => c.id));
        const toAdd = ng.comments.filter((c) => !existingIds.has(c.id));
        merged[idx].comments.push(...toAdd);
        merged[idx].comments.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      } else {
        merged.push(ng);
      }
    }
    merged.sort((a, b) => a.date.localeCompare(b.date));
    return merged;
  };

  const fetchComments = async (pageNum = 0, append = false) => {
    pageNum === 0 ? setLoading(true) : setIsLoadingMore(true);
    setError(null);

    if (!id || !user?.id) {
      setError("Missing required parameters");
      setLoading(false);
      setIsLoadingMore(false);
      return;
    }

    try {
      const resp = await fetchAPI(
        `/api/comments/getComments?postId=${id}&userId=${user.id}&page=${pageNum}&limit=25`,
        { method: "GET" }
      );
      if (resp?.error) throw new Error(resp.error);
      const rows = (resp?.data ?? []) as PostComment[];

      const likeStatuses: Record<number, boolean> = {};
      const likeCounts: Record<number, number> = {};
      rows.forEach((c: any) => {
        likeStatuses[c.id] = !!c.is_liked;
        likeCounts[c.id] = c.like_count ?? 0;
      });

      const grouped = groupAndSort(rows);

      if (append) {
        setPostComments((prev) => mergeGroups(prev, grouped));
        if (nearBottomRef.current) {armAutoScroll()}   // auto-scroll on tail add
        else {
          setPostComments(grouped);
          armAutoScroll();                               // initial load -> bottom
        }
        bumpList();
      } else {
        setPostComments(grouped);
      }

      setCommentLikes((p) => ({ ...p, ...likeStatuses }));
      setCommentLikeCounts((p) => ({ ...p, ...likeCounts }));
      setHasMore(Boolean(resp?.pagination?.hasMore));
      setPage(pageNum);

      bumpList(); // remount on structural changes
    } catch (e) {
      setError("Failed to load comments. Please try again.");
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (id && user?.id) fetchComments(0, false);
  }, [id, user?.id]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) fetchComments(page + 1, true);
  };

  // ---- Reply / Delete / Submit ----
  const handleReplyComment = useCallback(
    (comment: PostComment) => {
      setReplyTo(String(comment.id));
      setReplyView(comment);
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [setReplyTo]
  );

  const handleDeleteComment = useCallback(
    async (commentId: number) => {
      prevCommentsRef.current = postComments;

      // optimistic remove
      setPostComments((prev) =>
        prev
          .map((g) => ({ ...g, comments: g.comments.filter((c) => c.id !== commentId) }))
          .filter((g) => g.comments.length > 0)
      );
      bumpList();

      if (replyView?.id === commentId) setReplyView(null);
      setReplyTo((cur) => (cur === String(commentId) ? "" : cur));

      try {
        const res = await fetchAPI(`/api/comments/deleteComment`, {
          method: "DELETE",
          body: JSON.stringify({ id: commentId }),
        });
        if (res?.error) throw new Error(res.error);
        showAlert({ title: "Deleted", message: "Comment removed.", type: "SUCCESS", status: "success" });
      } catch {
        // rollback
        setPostComments(prevCommentsRef.current);
        bumpList();
        showAlert({
          title: "Error",
          message: "Failed to delete comment. Please try again.",
          type: "ERROR",
          status: "error",
        });
      }
    },
    [postComments, replyView]
  );

  const handleCommentSubmit = async () => {
    if (isSubmitting) return;
    const trimmed = newComment.trim();

    if (!trimmed || !id || !user?.id) {
      const missing_fields = []
      if (!trimmed) {missing_fields.push("trimmed")}
      if (!id) {missing_fields.push("id")}
      if (!user?.id) {missing_fields.push("userId")}

      console.log("[MISSING FIELDS]: ", missing_fields.join(", "))

      showAlert({
        title: "Error",
        message: `Unable to submit comment. Missing required data: ${missing_fields.join(", ")}.`,
        type: "ERROR",
        status: "error",
      });
      return;
    }

    if (soundEffectsEnabled) playSoundEffect(SoundType.Navigation);

    setNewComment("");
    setIsSubmitting(true);

    // optimistic username
    let optimisticUsername = "Anonymous";
    for (const g of postComments) {
      const uc = g.comments.find((c) => c.user_id === user.id);
      if (uc?.username && uc.username !== "Anonymous") {
        optimisticUsername = uc.username;
        break;
      }
    }
    if (optimisticUsername === "Anonymous") {
      try {
        const ures = await fetchAPI(`/api/users/getUsername?clerkId=${user.id}`, { method: "GET" });
        if (ures?.data?.username) optimisticUsername = ures.data.username;
      } catch {}
    }

    const tempId = Date.now();
    const nowIso = new Date().toISOString();
    const temp: PostComment = {
      id: tempId,
      post_id: parseInt(id as string, 10),
      user_id: user.id,
      sender_id: user.id,
      content: trimmed,
      username: optimisticUsername,
      created_at: nowIso,
      like_count: 0,
      report_count: 0,
      is_liked: false,
      index: 0,
      postColor: postColor?.hex || "#000000",
      reply_comment_id: replyView?.id ?? null,
    };

    // optimistic add to today's bucket
    setPostComments((prev) => {
      const key = normalizeDayKey(nowIso);
      const copy = JSON.parse(JSON.stringify(prev)) as PostCommentGroup[];
      const idx = copy.findIndex((g) => g.date === key);
      if (idx >= 0) copy[idx].comments.push(temp);
      else copy.push({ date: key, comments: [temp] });
      copy.sort((a, b) => a.date.localeCompare(b.date));
      return copy;
    });
    bumpList();

    // only auto-scroll if near bottom (prevents jump while user reads older content)
    if (nearBottomRef.current) {
      setAutoScrollNextSizeChange(true);
    }

    setReplyView(null);
    setReplyTo("");

    try {
      const response = await fetchAPI(`/api/comments/newComment`, {
        method: "POST",
        body: JSON.stringify({
          content: trimmed,
          postId: id,
          clerkId: user.id,
          postClerkId: user.id,
          replyId: replyTo ?? null,
        }),
      });
      if (response?.error) throw new Error(response.error);
    } catch {
      // remove optimistic
      setPostComments((prev) =>
        prev
          .map((g) => ({ ...g, comments: g.comments.filter((c) => c.id !== tempId) }))
          .filter((g) => g.comments.length > 0)
      );
      bumpList();
      setNewComment(trimmed);
      showAlert({
        title: "Error",
        message: "Failed to submit comment. Please try again.",
        type: "ERROR",
        status: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- List render ----
  const renderCommentItem = ({ item }: { item: PostCommentGroup }) => {
    const prettyDate = getRelativeTime(new Date(item.date).toDateString());
    return (
      <View className="mb-4">
        <Text className="text-gray-500 text-center text-xs">{prettyDate}</Text>
        {item.comments.map((comment, index) => (
          <CommentItem
            key={comment.id}
            id={comment.id}
            user_id={comment.user_id}
            sender_id={comment.sender_id}
            post_id={comment.post_id}
            index={index}
            username={
              anonymousComments
                ? ""
                : index > 0
                ? item.comments[index - 1].username === comment.username
                  ? ""
                  : comment.username
                : comment.username
            }
            like_count={comment.like_count || 0}
            content={comment.content}
            created_at={comment.created_at}
            report_count={comment.report_count}
            is_liked={!!commentLikes[comment.id]}
            postColor={postColor?.hex}
            reply_comment_id={comment.reply_comment_id}
            nickname={""}
            incognito_name={""}
            onReply={() => handleReplyComment(comment)}
            onDelete={() => handleDeleteComment(comment.id)}
            currentUserId={user?.id}
            scrollSimultaneousHandlerRef={flatListRef}
          />
        ))}
      </View>
    );
  };

  const keyExtractor = (item: PostCommentGroup) => item.date;

  const getItemLayout = (_: PostCommentGroup[] | null | undefined, index: number) => ({
    length: 120,
    offset: 120 * index,
    index,
  });

  // Track if user is near bottom to decide whether to autoscroll when new items arrive
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentSize, contentOffset, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    nearBottomRef.current = distanceFromBottom < BOTTOM_THRESHOLD;
  };

  return (
    <KeyboardAvoidingView
      keyboardVerticalOffset={isIOS ? 64 : 0}
      behavior={isIOS ? "padding" : "height"}
      className="flex-1 pt-4 px-2"
      style={{
        minHeight: 500
      }}
    >
      <Pressable onPress={() => Keyboard.dismiss()} className="flex-1">
        {/* MAIN COLUMN: 80% LIST */}
        <View className="flex-1 relative px-6">
          {loading && (
            <View className="flex-1 items-center justify-center">
              <ColoreActivityIndicator text="Summoning Bob..." />
            </View>
          )}

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
              key={listVersion} // force remount on structural change
              renderItem={renderCommentItem}
              keyExtractor={keyExtractor}
              className="flex-1 rounded-2xl"
              contentContainerClassName="p-4 pb-6"
              contentContainerStyle={{ paddingBottom: 64 }}
              extraData={[postComments, listVersion]}
              ListEmptyComponent={
                <EmptyListView message={"Be the first to comment."} character="bob" mood={0} />
              }
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isLoadingMore ? (
                  <View className="py-5">
                    <ColoreActivityIndicator />
                  </View>
                ) : null
              }
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              maintainVisibleContentPosition={isIOS ? { minIndexForVisible: 0 } : undefined}
              getItemLayout={getItemLayout}
              removeClippedSubviews={false}
              initialNumToRender={6}
              maxToRenderPerBatch={8}
              windowSize={7}
              onScroll={onScroll}
              onContentSizeChange={() => {
                if (autoScrollNextSizeChange) {
                  flatListRef.current?.scrollToEnd({ animated: true });
                  scrollToBottom(true);
                  setAutoScrollNextSizeChange(false);
                }

              }}
            />
          )}
        </View>

        {/* 20% REPLY + COMPOSER */}
        <View className="flex-1 relative justify-end px-4"
        style={{
          minHeight: 64
        }}>
          {/* Reply preview (clamped by natural content + container height) */}
          {replyView && (
              <View className="relative py-1 mx-2 flex-row items-start  bg-white border-t-2 border-gray-100">
                
                {/* Colored side accent */}
                <View className="absolute left-0 top-0 bottom-0" />

                {/* Inner content */}
                <View className="flex-1 px-4 py-3 ml-1.5">
                  <Text 
                    className="text-sm text-gray-700 leading-snug" 
                    numberOfLines={2} 
                    ellipsizeMode="tail"
                  >
                    {replyView.content}
                  </Text>
                </View>

                {/* Close button */}
                <TouchableOpacity
                  onPress={() => setReplyView(null)}
                  className="self-center mr-4 p-2 rounded-full bg-gray-100 active:bg-gray-200"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Image 
                    source={icons.close} 
                    className="h-3 w-3" 
                    tintColor={"#6b7280"} 
                  />
                </TouchableOpacity>
              </View>
            )}


          {/* Composer fills remaining space in the 20% panel */}
          <View className="relative flex flex-row items-center bg-white rounded-[32px] px-4 mx-2 mb-2 shadow-md min-h-12">
            <TextInput
              ref={inputRef}
              className="flex-1 pl-2 text-sm pr-16 py-4"
              placeholderTextColor="#9CA3AF"
              placeholder="Write something..."
              value={newComment}
              multiline
              scrollEnabled
              onChangeText={(t) => {
                const max = 300;
                if (t.length <= max) setNewComment(t);
                else {
                  setNewComment(t.slice(0, max));
                  showAlert({
                    title: "Limit Reached",
                    message: `You can only enter up to ${max} characters.`,
                    type: "ERROR",
                    status: "error",
                  });
                }
              }}
              onSubmitEditing={isSubmitting ? undefined : handleCommentSubmit}
              editable={!isSubmitting}
              textAlignVertical="center"
            />
            <View className="absolute right-1 w-1/4">
              <CustomButton
                title={isSubmitting ? "..." : "Send"}
                onPress={handleCommentSubmit}
                disabled={newComment.length === 0 || isSubmitting}
                fontSize="sm"
                bgVariant={newComment.length === 0 || isSubmitting ? "gradient2" : undefined}
                padding={3}
              />
            </View>
          </View>
        </View>
      </Pressable>
    </KeyboardAvoidingView>
  );
};

export default CommentView;

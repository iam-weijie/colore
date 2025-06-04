import { useCallback, useEffect, useState } from "react";
import { Dimensions } from "react-native";
import { fetchAPI } from "@/lib/fetch";
import { Post } from "@/types/type";

export const useFetchUserData = (userId: string, setError: any) => {
  const [profileUser, setProfileUser] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await fetchAPI(`/api/users/getUserInfo?id=${userId}`, {
          method: 'GET'
        });
        setProfileUser(response.data[0]);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setError("Failed to load profile");
      }
    };
    fetch();
  }, [userId]);

  return profileUser;
};

export const usePersonalPosts = (
  { userId, viewerId, boardId, isIpad, isOwnBoard, postRefIDs, updatePinnedPosts, setUpdatePinnedPosts }
) => {
  const [boardOnlyPosts, setBoardOnlyPosts] = useState<Post[]>([]);
  const [maxPosts, setMaxPosts] = useState(0);

  const fetchPosts = useCallback(async () => {

    const maxPostOnScreen = postRefIDs.length == 0
      ? (isIpad ? 48 : 32)
      : Math.min(postRefIDs.length + 14, (isIpad ? 24 : 18));
    setMaxPosts(maxPostOnScreen);

    try {
      let posts, filteredPosts, board;
      if (boardId > 0) {
        board = await fetchAPI(`/api/boards/getBoardById?id=${boardId}`);
        posts = await fetchAPI(`/api/posts/getPostsByBoardId?id=${boardId}`);
        filteredPosts = board.data.restrictions.includes("Everyone")
          ? posts.data
          : posts.data.filter((p: Post) => p.recipient_user_id == userId);
      } else {
        posts = await fetchAPI(`/api/posts/getPersonalPosts?number=${maxPostOnScreen}&recipient_id=${userId}&user_id=${viewerId}`);
        if (!posts.data.length) return;
        filteredPosts = posts.data.filter((post: Post) =>
          isOwnBoard || post.clerk_id == viewerId || post.pinned);
      }

      const filteredBoardPosts = boardId == -1
        ? filteredPosts
        : filteredPosts.filter((p: Post) => p.board_id == boardId);

      setBoardOnlyPosts(filteredBoardPosts.map(post => ({
        ...post,
        pinned: post.pinned,
        like_count: post.like_count || 0,
        report_count: post.report_count || 0,
        unread_comments: post.unread_comments || 0
      })));

    } catch (e) {
      console.error("Failed to fetch posts:", e);
    }
  }, [userId, viewerId, boardId, isIpad, postRefIDs]);

  return { boardOnlyPosts, fetchPosts };
};

export const fetchNewPersonalPost = async ({ excludeIds, boardId, userId, clerkId }) => {
  try {
    const excludeIdsParam = excludeIds.join(',');
    const res = await fetch(`/api/posts/getPersonalPostsExcluding?number=1&user_id=${clerkId}&recipient_id=${userId}&exclude_ids=${excludeIdsParam}`);
    const result = await res.json();
    const filteredForBoard = result.data.filter((p) => p.board_id == boardId);
    return filteredForBoard[0] || null;
  } catch (e) {
    console.error("Error fetching new post:", e);
    return null;
  }
};

export const getShuffledPosts = (posts: Post[]) => [...posts].sort(() => Math.random() - 0.5);


import { useCallback, useEffect, useState } from "react";
import { Dimensions } from "react-native";
import { fetchAPI } from "@/lib/fetch";
import { Board, Post, UsePersonalPostsParams } from "@/types/type";

const POSTS_CONFIG = {
  IPAD_MAX: 48,
  MOBILE_MAX: 32,
  IPAD_LIMIT: 24,
  MOBILE_LIMIT: 18,
  EXTRA_POSTS: 14,
} as const;

const calculateMaxPosts = (postRefIDs: number[], isIpad: boolean): number => {
  if (postRefIDs.length === 0) {
    return isIpad ? POSTS_CONFIG.IPAD_MAX : POSTS_CONFIG.MOBILE_MAX;
  }

  const limit = isIpad ? POSTS_CONFIG.IPAD_LIMIT : POSTS_CONFIG.MOBILE_LIMIT;
  return Math.min(postRefIDs.length + POSTS_CONFIG.EXTRA_POSTS, limit);
};

const filterPostsByRestrictions = (
  posts: Post[],
  board: Board,
  userId: string
): Post[] => {
  return board.restrictions.includes("Everyone")
    ? posts
    : posts.filter((post: Post) => post.recipient_user_id === userId);
};

const filterPersonalPosts = (
  posts: Post[],
  isOwnBoard: boolean,
  viewerId: string
): Post[] => {
  return posts.filter(
    (post: Post) => isOwnBoard || post.user_id === viewerId || post.pinned
  );
};

const filterPostsByBoard = (posts: Post[], boardId: number): Post[] => {
  return boardId === -1
    ? posts
    : posts.filter((post: Post) => post.board_id == boardId);
};

export const usePersonalPosts = (params: UsePersonalPostsParams) => {
  const { userId, viewerId, boardId, isIpad, isOwnBoard, postRefIDs } = params;

  const [boardOnlyPosts, setBoardOnlyPosts] = useState<Post[]>([]);
  const [maxPosts, setMaxPosts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBoardPosts = async (
    boardId: number,
    userId: string
  ): Promise<Post[]> => {
    const [boardResponse, postsResponse] = await Promise.all([
      fetchAPI(`/api/boards/getBoardById?id=${boardId}`),
      fetchAPI(`/api/posts/getPostsByBoardId?id=${boardId}&userId=${userId}`),
    ]);

    return filterPostsByRestrictions(
      postsResponse.data,
      boardResponse.data,
      userId
    );
  };

  const fetchPersonalPosts = async (
    userId: string,
    viewerId: string
  ): Promise<Post[]> => {
    const response = await fetchAPI(
      `/api/posts/getPersonalPosts?recipient_id=${userId}&user_id=${viewerId}`
    );

    if (!response.data.length) {
      return [];
    }

    return filterPersonalPosts(response.data, isOwnBoard, viewerId);
  };

  const fetchPosts = useCallback(async (): Promise<Post[]> => {
    setIsLoading(true);
    setError(null);

    try {
      let filteredPosts: Post[];

      if (boardId > 0) {
        filteredPosts = await fetchBoardPosts(boardId, userId);
      } else {
        filteredPosts = await fetchPersonalPosts(userId, viewerId);
      }

      const finalPosts = filterPostsByBoard(filteredPosts, boardId);

      setBoardOnlyPosts(finalPosts);
      return finalPosts; // Return the fresh data
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch posts";
      setError(errorMessage);
      console.error("Failed to fetch posts:", error);
      return []; // Return empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [userId, viewerId, boardId, isIpad, isOwnBoard, postRefIDs]);

  return {
    boardOnlyPosts,
    fetchPosts,
    maxPosts,
    isLoading,
    error,
  };
};

export const useFetchUserData = (userId: string, setError: any) => {
  const [profileUser, setProfileUser] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await fetchAPI(`/api/users/getUserInfo?id=${userId}`, {
          method: "GET",
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

export const fetchNewPersonalPost = async ({
  excludeIds,
  boardId,
  userId,
  clerkId,
}) => {
  try {
    const excludeIdsParam = excludeIds.join(",");
    const res = await fetch(
      `/api/posts/getPersonalPostsExcluding?number=1&user_id=${clerkId}&recipient_id=${userId}&exclude_ids=${excludeIdsParam}`
    );
    const result = await res.json();
    const filteredForBoard = result.data.filter((p) => p.board_id == boardId);
    return filteredForBoard[0] || null;
  } catch (e) {
    console.error("Error fetching new post:", e);
    return null;
  }
};

export const getShuffledPosts = (posts: Post[]) =>
  [...posts].sort(() => Math.random() - 0.5);

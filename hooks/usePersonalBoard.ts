import { useCallback, useEffect, useState } from "react";
import { Dimensions } from "react-native";
import { fetchAPI } from "@/lib/fetch";
import { Board, Post, UsePersonalPostsParams } from "@/types/type";
import { useEncryptionContext } from "@/app/contexts/EncryptionContext";
import { useDecryptPosts } from "./useDecrypt";

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
    : posts.filter((p: Post) => p.board_id == boardId);
};

export const usePersonalPosts = (params: UsePersonalPostsParams) => {
  const { userId, viewerId, boardId, isIpad, isOwnBoard, postRefIDs } = params;

  const [boardOnlyPosts, setBoardOnlyPosts] = useState<Post[]>([]);
  const [maxPosts, setMaxPosts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { encryptionKey } = useEncryptionContext();
  
  // Use the new decrypt posts hook
  const { decryptPosts } = useDecryptPosts({
    encryptionKey,
    userId,
    debugPrefix: "usePersonalBoard"
  });

  const fetchBoardPosts = async (
    boardId: number,
    userId: string
  ): Promise<Post[]> => {
    console.log(`[usePersonalBoard]: Fetching board posts for boardId=${boardId}, userId=${userId}`);
    try {
      const [boardResponse, postsResponse] = await Promise.all([
        fetchAPI(`/api/boards/getBoardById?id=${boardId}`),
        fetchAPI(`/api/posts/getPostsByBoardId?id=${boardId}&userId=${userId}`),
      ]);
      
      console.log(`[usePersonalBoard]: Board API response status:`, boardResponse.status);
      console.log(`[usePersonalBoard]: Posts API response status:`, postsResponse.status);

      const filteredPosts = filterPostsByRestrictions(
        postsResponse.data,
        boardResponse.data,
        userId
      );
      
      console.log(`[usePersonalBoard]: Filtered posts count:`, filteredPosts.length);
      return filteredPosts;
    } catch (error) {
      console.error("[usePersonalBoard]: Error in fetchBoardPosts:", error);
      throw error;
    }
  };

  const fetchPersonalPosts = async (
    userId: string,
    viewerId: string
  ): Promise<Post[]> => {
    console.log(`[usePersonalBoard]: Fetching personal posts for userId=${userId}, viewerId=${viewerId}`);
    try {
      const response = await fetchAPI(
        `/api/posts/getPersonalPosts?recipient_id=${userId}&user_id=${viewerId}`
      );
      
      console.log(`[usePersonalBoard]: Personal posts API response status:`, response.status);
      console.log(`[usePersonalBoard]: Personal posts data count:`, response.data?.length || 0);

      if (!response.data.length) {
        console.log("[usePersonalBoard]: No personal posts found");
        return [];
      }

      const filteredPosts = filterPersonalPosts(response.data, isOwnBoard, viewerId);
      console.log(`[usePersonalBoard]: Filtered personal posts count:`, filteredPosts.length);
      return filteredPosts;
    } catch (error) {
      console.error("[usePersonalBoard]: Error in fetchPersonalPosts:", error);
      throw error;
    }
  };

  const fetchPosts = useCallback(async (): Promise<Post[]> => {
    console.log("[usePersonalBoard]: fetchPosts called with boardId=", boardId);
    setIsLoading(true);
    setError(null);

    try {
      let filteredPosts: Post[];

      if (boardId > 0) {
        console.log("[usePersonalBoard]: Fetching board posts");
        filteredPosts = await fetchBoardPosts(boardId, userId);
      } else {
        console.log("[usePersonalBoard]: Fetching personal posts");
        filteredPosts = await fetchPersonalPosts(userId, viewerId);
      }

      
      const finalPosts = filterPostsByBoard(filteredPosts, boardId)
        .map((p: Post) => {
          const isPrivate = Boolean(p.recipient_user_id);
          if (isPrivate && encryptionKey) {
            try {
              console.log("[DEBUG] usePersonalBoard - Attempting to decrypt post:", p.id);
              
              // Use the hook to decrypt the post
              const decryptedPosts = decryptPosts([p]);
              const decryptedPost = decryptedPosts[0];
              
              if (decryptedPost && decryptedPost.content !== p.content) {
                console.log("[DEBUG] usePersonalBoard - Decrypted content:", decryptedPost.content.substring(0, 30));
                return decryptedPost;
              }
            } catch (e) {
              console.warn("[DEBUG] usePersonalBoard - Failed decryption for post", p.id, e);
            }
          }
          return p;
        });

      console.log("[DEBUG] usePersonalBoard - Final posts after decryption:", finalPosts.length);
      if (finalPosts.length > 0) {
        console.log("[DEBUG] usePersonalBoard - First final post content:", finalPosts[0].content.substring(0, 30));
      }

      setBoardOnlyPosts(finalPosts);
      return finalPosts; // Return the fresh data
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch posts";
      setError(errorMessage);
      console.error("[usePersonalBoard]: Failed to fetch posts:", error);
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

interface FetchNewPersonalPostParams {
  excludeIds: number[];
  boardId: number;
  userId: string;
  clerkId: string;
}

export const fetchNewPersonalPost = async ({
  excludeIds,
  boardId,
  userId,
  clerkId,
}: FetchNewPersonalPostParams): Promise<Post | null> => {
  try {
    const excludeIdsParam = excludeIds.join(",");
    const res = await fetch(
      `/api/posts/getPersonalPostsExcluding?number=1&user_id=${clerkId}&recipient_id=${userId}&exclude_ids=${excludeIdsParam}`
    );
    const result = await res.json();
    const filteredForBoard = result.data.filter((p: Post) => p.board_id == boardId);
    return filteredForBoard[0] || null;
  } catch (e) {
    console.error("Error fetching new post:", e);
    return null;
  }
};

export const getShuffledPosts = (posts: Post[]) =>
  [...posts].sort(() => Math.random() - 0.5);

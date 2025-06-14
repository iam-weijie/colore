import { useCallback, useEffect, useState } from "react";
import { Dimensions } from "react-native";
import { fetchAPI } from "@/lib/fetch";
import { Board, Post, UsePersonalPostsParams } from "@/types/type";
import { decryptText } from "@/lib/encryption";
import { useGlobalContext } from "@/app/globalcontext";

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

  const { encryptionKey } = useGlobalContext();

  const fetchBoardPosts = async (
    boardId: number,
    userId: string
  ): Promise<Post[]> => {
    const [boardResponse, postsResponse] = await Promise.all([
      fetchAPI(`/api/boards/getBoardById?id=${boardId}`),
      fetchAPI(`/api/posts/getPostsByBoardId?id=${boardId}&userId=${userId}`),
    ]);

    console.log("[usePersonalBoard]: ", boardResponse.length, postsResponse.length)
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

      console.log("[DEBUG] usePersonalBoard - Got posts:", filteredPosts.length);
      console.log("[DEBUG] usePersonalBoard - First post content:", filteredPosts[0]?.content?.substring(0, 30));
      console.log("[DEBUG] usePersonalBoard - First post has formatting_encrypted:", Boolean(filteredPosts[0]?.formatting_encrypted));
      
      const finalPosts = filterPostsByBoard(filteredPosts, boardId)
        .map((p: Post) => {
          const isPrivate = Boolean(p.recipient_user_id);
          if (isPrivate && encryptionKey) {
            try {
              console.log("[DEBUG] usePersonalBoard - Attempting to decrypt post:", p.id);
              // Decrypt the content
              const decryptedContent = decryptText(p.content, encryptionKey);
              console.log("[DEBUG] usePersonalBoard - Decrypted content:", decryptedContent.substring(0, 30));
              
              // Handle formatting - check both formatting and formatting_encrypted fields
              let decryptedFormatting = p.formatting;
              
              // If formatting_encrypted exists, it takes precedence (newer format)
              if (p.formatting_encrypted && typeof p.formatting_encrypted === "string") {
                try {
                  const decryptedFormattingStr = decryptText(p.formatting_encrypted, encryptionKey);
                  decryptedFormatting = JSON.parse(decryptedFormattingStr);
                  console.log("[DEBUG] usePersonalBoard - Successfully decrypted formatting_encrypted field");
                } catch (formattingError) {
                  console.warn("[DEBUG] usePersonalBoard - Failed to decrypt formatting_encrypted for post", p.id, formattingError);
                  // Fall back to regular formatting if available
                }
              } 
              // Otherwise try the old way (formatting as encrypted string)
              else if (p.formatting && typeof p.formatting === "string" && 
                      ((p.formatting as string).startsWith('U2FsdGVkX1') || (p.formatting as string).startsWith('##FALLBACK##'))) {
                try {
                  const decryptedFormattingStr = decryptText(p.formatting as unknown as string, encryptionKey);
                  decryptedFormatting = JSON.parse(decryptedFormattingStr);
                  console.log("[DEBUG] usePersonalBoard - Successfully decrypted formatting string");
                } catch (formattingError) {
                  console.warn("[DEBUG] usePersonalBoard - Failed to decrypt formatting for post", p.id, formattingError);
                }
              }
              
              return { 
                ...p, 
                content: decryptedContent, 
                formatting: decryptedFormatting 
              };
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
      console.error("[DEBUG] usePersonalBoard - Failed to fetch posts:", error);
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

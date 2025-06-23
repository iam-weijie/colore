import { useCallback, useEffect, useState } from "react";
import { Dimensions } from "react-native";
import { fetchAPI } from "@/lib/fetch";
import { Board, Post, Stacks, UsePersonalPostsParams } from "@/types/type";
import { decryptText } from "@/lib/encryption";
import { useEncryptionContext } from "@/app/contexts/EncryptionContext";

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
  return boardId < 0 ? posts : posts.filter((p: Post) => p.board_id == boardId);
};

export const usePersonalPosts = (params: UsePersonalPostsParams) => {
  const { userId, viewerId, boardId, isIpad, isOwnBoard, postRefIDs } = params;

  const [boardOnlyPosts, setBoardOnlyPosts] = useState<(Post | Stacks)[]>([]);
  const [maxPosts, setMaxPosts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { encryptionKey } = useEncryptionContext();

  const fetchBoardPosts = async (
    boardId: number,
    userId: string
  ): Promise<Post[]> => {
    console.log(
      `[usePersonalBoard]: Fetching board posts for boardId=${boardId}, userId=${userId}`
    );
    try {
      const [boardResponse, postsResponse] = await Promise.all([
        fetchAPI(`/api/boards/getBoardById?id=${boardId}`),
        fetchAPI(`/api/posts/getPostsByBoardId?id=${boardId}&userId=${userId}`),
      ]);

      console.log(
        `[usePersonalBoard]: Board API response status:`,
        boardResponse.status
      );
      console.log(
        `[usePersonalBoard]: Posts API response status:`,
        postsResponse.status
      );

      const filteredPosts = filterPostsByRestrictions(
        postsResponse.data,
        boardResponse.data,
        userId
      );

      console.log(
        `[usePersonalBoard]: Filtered posts count:`,
        filteredPosts.length
      );
      return filteredPosts;
    } catch (error) {
      console.error("[usePersonalBoard]: Error in fetchBoardPosts:", error);
      throw error;
    }
  };

  const fetchSharedStacks = async (userId: string): Promise<Post[]> => {
    console.log(
      `[usePersonalBoard]: Fetching shared with me stacks for userId=${userId}`
    );

    try {
      const stacks = await fetchAPI(
        `/api/stacks/getSharedStacks?user_id=${userId}`
      );

      let stackPosts = [];

      for (let i = 0; i < stacks.data.length; i++) {
        const response = await fetchAPI(
          `/api/posts/getPostsById?ids=${stacks.data[i].ids}`
        );

        stackPosts.push(...response.data);
      }

      console.log(
        `[usePersonalBoard]: Shared stacks API response status:`,
        stacks.status
      );
      console.log(
        `[usePersonalBoard]: Shared stacks data count:`,
        stackPosts.length
      );

      if (!stackPosts.length) {
        console.log("[usePersonalBoard]: No posts from shared stacks found");
        return [];
      }

      return stackPosts;
    } catch (error) {
      console.error("[usePersonalBoard]: Error in fetchSharedStacks:", error);
      throw error;
    }
  };

  const fetchPersonalPosts = async (
    userId: string,
    viewerId: string
  ): Promise<Post[]> => {
    console.log(
      `[usePersonalBoard]: Fetching personal posts for userId=${userId}, viewerId=${viewerId}`
    );
    try {
      const response = await fetchAPI(
        `/api/posts/getPersonalPosts?recipient_id=${userId}&user_id=${viewerId}`
      );

      console.log(
        `[usePersonalBoard]: Personal posts API response status:`,
        response.status
      );
      console.log(
        `[usePersonalBoard]: Personal posts data count:`,
        response.data?.length || 0
      );

      if (!response.data.length) {
        console.log("[usePersonalBoard]: No personal posts found");
        return [];
      }

      const filteredPosts = filterPersonalPosts(
        response.data,
        isOwnBoard,
        viewerId
      );
      console.log(
        `[usePersonalBoard]: Filtered personal posts count:`,
        filteredPosts.length
      );
      return filteredPosts;
    } catch (error) {
      console.error("[usePersonalBoard]: Error in fetchPersonalPosts:", error);
      throw error;
    }
  };

  const fetchPosts = useCallback(async (): Promise<(Post | Stacks)[]> => {
    console.log("[usePersonalBoard]: fetchPosts called with boardId=", boardId);
    setIsLoading(true);
    setError(null);

    try {
      let filteredPosts: Post[];

      if (boardId > 0) {
        console.log("[usePersonalBoard]: Fetching board posts");
        filteredPosts = await fetchBoardPosts(boardId, userId);
      } else if (boardId == -2) {
        console.log("[usePersonalBoard]: Fetching shared with me stacks");
        filteredPosts = await fetchSharedStacks(userId);
      } else {
        console.log("[usePersonalBoard]: Fetching personal posts");
        filteredPosts = await fetchPersonalPosts(userId, viewerId);
      }

      const finalPosts = filterPostsByBoard(filteredPosts, boardId).map(
        (p: Post) => {
          const isPrivate = Boolean(p.recipient_user_id);
          if (isPrivate && encryptionKey) {
            try {
              console.log(
                "[DEBUG] usePersonalBoard - Attempting to decrypt post:",
                p.id
              );
              // Decrypt the content
              const decryptedContent = decryptText(p.content, encryptionKey);
              console.log(
                "[DEBUG] usePersonalBoard - Decrypted content:",
                decryptedContent.substring(0, 30)
              );

              // Handle formatting - check both formatting and formatting_encrypted fields
              let decryptedFormatting = p.formatting;

              // If formatting_encrypted exists, it takes precedence (newer format)
              if (
                p.formatting_encrypted &&
                typeof p.formatting_encrypted === "string"
              ) {
                try {
                  const decryptedFormattingStr = decryptText(
                    p.formatting_encrypted,
                    encryptionKey
                  );
                  decryptedFormatting = JSON.parse(decryptedFormattingStr);
                  console.log(
                    "[DEBUG] usePersonalBoard - Successfully decrypted formatting_encrypted field"
                  );
                } catch (formattingError) {
                  console.warn(
                    "[DEBUG] usePersonalBoard - Failed to decrypt formatting_encrypted for post",
                    p.id,
                    formattingError
                  );
                  // Fall back to regular formatting if available
                }
              }
              // Otherwise try the old way (formatting as encrypted string)
              else if (
                p.formatting &&
                typeof p.formatting === "string" &&
                ((p.formatting as string).startsWith("U2FsdGVkX1") ||
                  (p.formatting as string).startsWith("##FALLBACK##"))
              ) {
                try {
                  const decryptedFormattingStr = decryptText(
                    p.formatting as unknown as string,
                    encryptionKey
                  );
                  decryptedFormatting = JSON.parse(decryptedFormattingStr);
                  console.log(
                    "[DEBUG] usePersonalBoard - Successfully decrypted formatting string"
                  );
                } catch (formattingError) {
                  console.warn(
                    "[DEBUG] usePersonalBoard - Failed to decrypt formatting for post",
                    p.id,
                    formattingError
                  );
                }
              }

              return {
                ...p,
                content: decryptedContent,
                formatting: decryptedFormatting,
              };
            } catch (e) {
              console.warn(
                "[DEBUG] usePersonalBoard - Failed decryption for post",
                p.id,
                e
              );
            }
          }
          return p;
        }
      );

      console.log(
        "[DEBUG] usePersonalBoard - Final posts after decryption:",
        finalPosts.length
      );
      if (finalPosts.length > 0) {
        console.log(
          "[DEBUG] usePersonalBoard - First final post content:",
          finalPosts[0].content.substring(0, 120)
        );
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
    const filteredForBoard = result.data.filter(
      (p: Post) => p.board_id == boardId
    );
    return filteredForBoard[0] || null;
  } catch (e) {
    console.error("Error fetching new post:", e);
    return null;
  }
};

export const getShuffledPosts = (posts: Post[]) =>
  [...posts].sort(() => Math.random() - 0.5);

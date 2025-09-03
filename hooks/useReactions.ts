import { useCallback, Dispatch, SetStateAction, useRef } from "react";
import { fetchAPI } from "@/lib/fetch";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects";
import { Post } from "@/types/type";
import { useAlert } from "@/notifications/AlertContext";

type Args = {
  currentPost?: Post;
  user?: { id: string } | null;
  isLiked: boolean;
  setIsLiked: Dispatch<SetStateAction<boolean>>;
  likeCount: number;
  setLikeCount: Dispatch<SetStateAction<number>>;
  isSaved: boolean;
  setIsSaved: Dispatch<SetStateAction<boolean>>;
  addSavedPost: (id: number) => void;
  removeSavedPost: (id: number) => void;
  soundEffectsEnabled: boolean;
  isNavigating?: boolean;
};

export function useReactions({
  currentPost,
  user,
  isLiked,
  setIsLiked,
  likeCount,
  setLikeCount,
  isSaved,
  setIsSaved,
  addSavedPost,
  removeSavedPost,
  soundEffectsEnabled,
  isNavigating = false,
}: Args) {
  const { playSoundEffect } = useSoundEffects();
  const { showAlert } = useAlert();

  // Prevent concurrent like mutations, especially while swiping
  const isMutatingLikeRef = useRef(false);
  const lastTapTimeRef = useRef(0);

  const handleLikePress = useCallback(async () => {
    if (!currentPost || !user) return;
    if (isNavigating) return; // Prevent likes during swipe animations
    
    // Debounce rapid taps (especially during swipes)
    const now = Date.now();
    if (now - lastTapTimeRef.current < 300) return;
    lastTapTimeRef.current = now;
    
    if (isMutatingLikeRef.current) return; // guard against double taps / rapid swipes

    const postId = currentPost.id;
    const nextIsLiked = !isLiked;

    // optimistic update
    setIsLiked(nextIsLiked);
    setLikeCount((c) => (nextIsLiked ? c + 1 : Math.max(c - 1, 0)));

    isMutatingLikeRef.current = true;
    try {
      const res = await fetchAPI(`/api/posts/updateLikeCount`, {
        method: "PATCH",
        body: JSON.stringify({ 
          postId, 
          userId: user.id, 
          increment: nextIsLiked 
        }),
      });

      // Ignore if the card changed during the request
      if (currentPost?.id !== postId) {
        isMutatingLikeRef.current = false;
        return;
      }

      if (res?.error) throw new Error(res.error);

      // Sync to server truth if present
      const serverLiked = res?.data?.liked;
      const serverCount = res?.data?.likeCount;
      if (typeof serverLiked === "boolean") {
        setIsLiked(serverLiked);
      }
      if (typeof serverCount === "number") {
        setLikeCount(serverCount);
      }
    } catch (e: any) {
      console.error("like error:", e);
      // revert on error
      setIsLiked((v) => !v);
      setLikeCount((c) => (nextIsLiked ? Math.max(c - 1, 0) : c + 1));

      showAlert({
        title: "Error",
        message: "Failed to update like. Please try again.",
        type: "ERROR",
        status: "error",
      });
    } finally {
      isMutatingLikeRef.current = false;
    }
  }, [currentPost?.id, user?.id, isLiked, setIsLiked, setLikeCount, showAlert, isNavigating]);

  const handleSavePostPress = useCallback(
    async (postId?: number) => {
      if (!postId || !user) return;

      try {
        if (soundEffectsEnabled) playSoundEffect(SoundType.Tap);

        // optimistic
        if (isSaved) {
          removeSavedPost(postId);
        } else {
          addSavedPost(postId);
        }
        setIsSaved((v) => !v);

        showAlert({
          title: isSaved ? "Post Unsaved" : "Post Saved",
          message: isSaved ? "Post removed from your saved items." : "Post added to your saved items.",
          type: "SUCCESS",
          status: "success",
        });

        // persist
        try {
          const { handleSavePost } = await import("@/lib/post");
          await handleSavePost(postId, !isSaved, user.id);
        } catch (apiError) {
          console.error("Save/Unsave API error:", apiError);
        }
      } catch (error) {
        console.error("Error in handleSavePostPress:", error);
        // revert optimistic
        if (!isSaved) removeSavedPost(postId);
        else addSavedPost(postId);
        setIsSaved((v) => !v);

        showAlert({
          title: "Error",
          message: `Failed to ${isSaved ? "save" : "unsave"} post. Please try again.`,
          type: "ERROR",
          status: "error",
        });
      }
    },
    [user, isSaved, soundEffectsEnabled, playSoundEffect, addSavedPost, removeSavedPost, setIsSaved, showAlert]
  );

  return { handleLikePress, handleSavePostPress };
}

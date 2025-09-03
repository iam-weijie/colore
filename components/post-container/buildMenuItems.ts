import { icons } from "@/constants";
import { Post } from "@/types/type";
import { deletePost, handlePin } from "@/lib/post";
import { Alert } from "react-native";

type BuildMenuArgs = {
  isPreview: boolean;
  invertedColors: boolean;
  currentPost?: Post;
  user?: { id: string } | null;
  isSaved: boolean;

  onDelete?: () => void;                 // not used externally; we wire here
  onSaveToggle: () => void;              // save/unsave
  onShare: () => void;                   // share image
  onReport: () => void;                  // report email
  onPinChange: (didChange: boolean) => void; // notify parent
  handleCloseModal?: () => void;
  showAlert: (args: { title: string; message: string; type: "SUCCESS" | "ERROR"; status: "success" | "error" }) => void;
  router: any;
};

export function buildMenuItems({
  isPreview,
  currentPost,
  user,
  isSaved,
  onSaveToggle,
  onShare,
  onReport,
  onPinChange,
  handleCloseModal,
  showAlert,
}: BuildMenuArgs) {
  if (isPreview) return [];

  const items: Array<{ source: any; label: string; color: string; onPress: () => void | Promise<void> }> = [];

  // pin/unpin (recipient == current user)
  if (currentPost?.recipient_user_id === user?.id) {
    const pinned = Boolean(currentPost?.pinned);
    items.push({
      source: icons.pin,
      label: pinned ? "Unpin" : "Pin",
      color: "#000000",
      onPress: async () => {
        if (!currentPost || !user) return;

        try {
          // optimistic handled in parent by setting state on currentPost,
          // here we just call API and notify change.
          const newStatus = await handlePin(currentPost, pinned, user.id);
          handleCloseModal?.();
          onPinChange(newStatus);

          showAlert({
            title: pinned ? "Post Unpinned" : "Post Pinned",
            message: pinned ? "Post removed from pinned items." : "Post pinned to your profile.",
            type: "SUCCESS",
            status: "success",
          });
        } catch (e) {
          showAlert({
            title: "Error",
            message: `Failed to ${pinned ? "unpin" : "pin"} post. Please try again.`,
            type: "ERROR",
            status: "error",
          });
        }
      },
    });
  }

  const isOwner = currentPost && (currentPost.user_id === user?.id || currentPost.recipient_user_id === user?.id);

  if (isOwner) {
    items.push({
      source: icons.trash,
      label: "Delete",
      color: "#DA0808",
      onPress: () => {
        if (!currentPost || !user) return;

        Alert.alert(
          "Delete Post",
          "Are you sure you want to delete this post? This action cannot be undone.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                try {
                  const result = await deletePost(currentPost.id, user.id);
                  if (!result.success) throw new Error(result.error || "Failed to delete post");
                  showAlert({
                    title: "Post Deleted",
                    message: "Your post has been deleted.",
                    type: "SUCCESS",
                    status: "success",
                  });
                  handleCloseModal?.();
                } catch (error) {
                  showAlert({
                    title: "Error",
                    message: "Failed to delete post. Please try again.",
                    type: "ERROR",
                    status: "error",
                  });
                }
              },
            },
          ]
        );
      },
    });
  }

  items.push({
    source: icons.bookmark,
    label: isSaved ? "Unsave" : "Save",
    color: "#000000",
    onPress: onSaveToggle,
  });

  items.push({
    source: icons.send,
    label: "Share",
    color: "#000000",
    onPress: onShare,
  });

  if (!isOwner) {
    items.push({
      source: icons.info,
      label: "Report",
      color: "#DA0808",
      onPress: onReport,
    });
  }

  return items;
}

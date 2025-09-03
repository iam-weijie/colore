import { PostItColor, UserNicknamePair, Format, Post } from "@/types/type";
import { defaultColors } from "@/constants/colors";
import { useAllPostItColors } from "@/hooks/useTheme";

export interface PostCreationState {
  // User & Global State
  selectedUser?: UserNicknamePair;
  userUsername: string;
  
  // Post Content & Metadata
  postContent: string;
  selectedRecipientId: string;
  replyToPostId: number | null;
  
  // Styling & Formatting
  selectedColor: PostItColor;
  formats: Format[];
  isFocused: boolean;
  
  // Emoji Handling
  selectedStaticEmoji: boolean;
  selectedEmoji: string | null;
  isEmojiSelectorVisible: boolean;
  isQuickEmojiSelectorVisible: boolean;
  showRecentPopup: boolean;
  triggerPosition: { x: number; y: number };
  activeEmojiIndex: number;
  
  // UI State & Interactions
  selectedTab: string;
  isLinkHolderVisible: boolean;
  link: string;
  isSettingVisible: boolean;
  withdrawKeyboard: boolean;
  
  // Scheduling & Expiration
  selectedExpirationDate: string;
  selectedScheduleDate: string;
  
  // Refresh & Data Fetching
  refreshingKey: number;
}

export const usePostCreationState = (initialParams: {
  content?: string;
  color?: string;
  emoji?: string;
  recipientId?: string;
  username?: string;
  expiration?: string;
  prompt?: string;
  promptId?: string;
  boardId?: string;
}) => {
  const allColors = useAllPostItColors();
  
  const safeParam = (p: string | string[] | undefined): string =>
    Array.isArray(p) ? p[0] : (p ?? "");

  const content = safeParam(initialParams.content as any);
  const color = safeParam(initialParams.color as any);
  const emoji = safeParam(initialParams.emoji as any);
  const recipientId = safeParam(initialParams.recipientId as any);
  const username = safeParam(initialParams.username as any);
  const expiration = safeParam(initialParams.expiration as any);
  const prompt = safeParam(initialParams.prompt as any);
  const promptId = safeParam(initialParams.promptId as any);
  const boardId = safeParam(initialParams.boardId as any);

  return {
    content,
    color,
    emoji,
    recipientId,
    username,
    expiration,
    prompt,
    promptId,
    boardId,
    allColors,
    defaultColors,
  };
};

export const getPostTitle = (params: {
  postId?: string;
  prompt?: string;
  recipientId?: string;
  username?: string;
}) => {
  if (params.postId) {
    return "Edit Post";
  }
  if (params.prompt) {
    return `${Array.isArray(params.prompt) ? params.prompt[0] : params.prompt}`.trim();
  }
  if (params.recipientId) {
    return `@${params.username}`;
  }
  return "New Post";
};

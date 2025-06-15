import React, { createContext, useContext, useState } from "react";
import { Post } from "@/types/type";

// Empty draft template – sync with previous default values
const emptyDraft: Post = {
  id: 0,
  user_id: "",
  firstname: "",
  username: "",
  nickname: "",
  incognito_name: "",
  content: "",
  created_at: new Date().toISOString(),
  expires_at: "",
  available_at: "",
  static_emoji: false,
  city: "",
  state: "",
  country: "",
  like_count: 0,
  report_count: 0,
  unread_comments: 0,
  recipient_user_id: "",
  pinned: false,
  color: "",
  emoji: "",
  notified: false,
  prompt_id: 0,
  prompt: "",
  board_id: -1,
  reply_to: 0,
  unread: false,
  formatting: [],
};

export type DraftPostContextType = {
  draftPost: Post | null;
  setDraftPost: React.Dispatch<React.SetStateAction<Post | null>>;
  resetDraftPost: () => void;
};

const DraftPostContext = createContext<DraftPostContextType | undefined>(
  undefined
);

export const DraftPostProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [draftPost, setDraftPost] = useState<Post | null>(emptyDraft);

  const resetDraftPost = () =>
    setDraftPost({ ...emptyDraft, created_at: new Date().toISOString() });

  return (
    <DraftPostContext.Provider
      value={{ draftPost, setDraftPost, resetDraftPost }}
    >
      {children}
    </DraftPostContext.Provider>
  );
};

export const useDraftPost = () => {
  const ctx = useContext(DraftPostContext);
  if (!ctx)
    throw new Error("useDraftPost must be used within a DraftPostProvider");
  return ctx;
};

export default DraftPostProvider; 
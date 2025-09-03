// EmptyPostsView.tsx
import React from "react";
import PostContainer from "../post-container/PostContainer";
import { Post } from "@/types/type";

type Props = {
  isOwnProfile: boolean;
  userId: string;
};

const EmptyPostsView: React.FC<Props> = ({ isOwnProfile, userId }) => {
  const defaultPost = {
    id: 0,
    clerk_id: userId,
    user_id: userId,
    firstname: "",
    username: "",
    content: isOwnProfile
      ? `You have no pinned posts yet. 

Pinned posts will appear here.
Create a personal post and pin it with the three dots (⋯) at the bottom right of the post view! 
Share things about yourself with your friends!`
      : `Hi, I'm a new Coloré user! 

I haven't pinned any posts to my profile yet.`,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    city: "",
    state: "",
    country: "",
    like_count: 0,
    report_count: 0,
    unread_comments: 0,
    recipient_user_id: "",
    pinned: false,
    color: "yellow",
    emoji: "",
    notified: true,
    prompt_id: -1,
    prompt: "",
    board_id: -1,
    reply_to: 0,
    nickname: "",
    incognito_name: "",
    available_at: new Date().toISOString(),
    static_emoji: false,
    formatting: [],
    unread: false,
  } as unknown as Post;

  return (
    <PostContainer selectedPosts={[defaultPost]} handleCloseModal={() => {}} isShowCasing />
  );
};

export default EmptyPostsView;

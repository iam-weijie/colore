import { ImageSourcePropType, TextInputProps, TouchableOpacityProps } from "react-native";
import * as Haptics from 'expo-haptics'; // Import Haptics for the style type

declare interface Post {
  id: number;
  clerk_id: string;
  user_id?: string; // this is supposed to be a temporary fix to prevent weird type mismatch errors
  firstname: string;
  username: string;
  content: string;
  created_at: string;
  expires_at: string;
  city: string;
  state: string;
  country: string;
  like_count: number;
  report_count: number;
  unread_comments: number;
  recipient_user_id: string;
  pinned: boolean;
  color: string; //String for now. Should be changed to PostItColor
  emoji: string;
  notified: boolean;
  prompt_id: number;
  prompt: string;
  board_id: number;
  reply_to: number;
  unread: boolean;
  position?: {
    top: number;
    left: number;
  };
  
}

declare interface StylingType {
  id: number, 
  bold?: boolean,
  italic?: boolean,
  underlinde?: boolean,
  orderedList?: boolean,
  underedList?: boolean, 
  quote?: boolean
}
declare interface TextStylingType {
  id: number;
  value: string; 
  style: StylingType[];

}

declare interface InfoScreenProps {
  title: string;
  subtitle?: string;
  image: ImageSourcePropType;
  content: string;
  hasAction?: boolean;
  onAgree: () => void;
}

declare interface EmojiBackgroundProps {
  emoji: string;
  color: string;
}


declare interface Board {
  id: number;
  title: string;
  user_id: string;
  description: string;
  members_id: string[];
  board_type: string;
  restrictions: string[];
  created_at: string;
  color?: string;
  count?: number;
  isNew?: boolean;
  isPrivate?: boolean;
  commentAllowed: boolean;
  imageUrl?: string;
}

declare interface DraftPost {
content: string;
recipient_id: string;
color: string;
emoji: string;
}

declare interface DraftBoard {
user_id: string;
title: string;
board_type: string;
restriction: string;
description: string;
}

declare interface PostComment {
  id: number;
  post_id: number;
  user_id: string;
  sender_id: string;
  index: number;
  content: string;
  username: string;
  created_at: string;
  like_count: number;
  report_count: number;
  is_liked: boolean;
  postColor: string;
}

declare interface UserProfileType {
  id: number;
  clerk_id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  date_of_birth: string;
  city: string;
  state: string;
  country: string;
  device_token: string;
  is_paid_user: boolean;
  report_count: number;
  saved_posts: string[];
}

declare interface UserData {
  userInfo: UserProfileType;
  posts: Post[];
}

declare interface PostWithPosition extends Post {
  position: {
    top: number;
    left: number;
  };
}

declare interface PostItColor {
  name: string;
  id: number;
  hex: string;
  rarity: string;
  foldcolorhex: string;
  fontColor: string;
}

declare interface NavigationContextType {
  stateVars: any;
  setStateVars: (state: any) => void;
}

declare interface ButtonProps extends TouchableOpacityProps {
  title: string;
  bgVariant?:
    | "primary"
    | "secondary"
    | "danger"
    | "outline"
    | "success"
    | "gradient"
    | "gradient2"
    | "oauth";
  textVariant?:
    | "primary"
    | "default"
    | "secondary"
    | "danger"
    | "success"
    | "oauth";
  fontSize?: "sm" | "md" | "lg" | "xl" | "2xl"; // Added "2xl"
  padding?: string;
  IconLeft?: React.ComponentType<any>;
  IconRight?: React.ComponentType<any>;
  className?: string;
  // Haptic props removed, will be default behavior in CustomButton
}

declare interface UserPostsGalleryProps {
  posts: Post[];
  profileUserId: string;
  handleUpdate?: (id: number, isRemove: boolean) => void;
  query?: string;
  header?: React.ReactElement;
}

declare interface UserProfileProps {
  userId: string;
  friendStatus: FriendStatusType;
  tab: string;
  onSignOut?: () => void;
}

declare interface PostModalProps {
  isVisible: boolean;
  selectedPosts: Post[];
  handleCloseModal: () => void;
  invertedColors?: boolean;
  handleUpdate?: (isPinned: boolean) => void | Promise<void>;
  header?: React.ReactElement;
  isPreview?: boolean;
  infiniteScroll?: boolean;
  scrollToLoad?: () => void;
}

declare interface PostContainerProps {
  selectedPosts: Post[];
  handleCloseModal: () => void;
  invertedColors?: boolean;
  handleUpdate?: (isPinned: boolean) => void | Promise<void>;
  infiniteScroll?: boolean;
  header?: React.ReactElement;
  isPreview?: boolean;
  infiniteScroll?: boolean;
  scrollToLoad?: () => void;
}

declare interface UserPostsGalleryProps {
  posts: Post[];
}

type MappingPostitProps = {
  id: number;
  coordinates: {
    x_coordinate: number;
    y_coordinate: number;
  };
};


declare interface InputFieldProps extends TextInputProps {
  label: string;
  icon?: any;
  secureTextEntry?: boolean;
  labelStyle?: string;
  containerStyle?: string;
  inputStyle?: string;
  iconStyle?: string;
  className?: string;
  variant?: string;
}

declare interface NotificationBubbleProps {
  unread: number;
  color: string;
}

declare interface PaymentProps {
  fullName: string;
  email: string;
  amount: string;
}

declare interface ConversationItem {
  id: string;
  name: string;
  clerk_id: string;
  lastMessageContent: string | null;
  lastMessageTimestamp: Date | null;
  active_participants: number;
  unread_messages: number;
}

declare interface Message {
  id: number;
  senderId: string;
  content: string;
  timestamp: Date;
  unread: boolean;
  notified: boolean;
}

type UserNicknamePair = [string, string];

declare interface RawFriendRequest {
  id: number;
  user_id1: string;
  user_id2: string;
  requestor: "UID1" | "UID2";
  createdAt: Date;
  notified: boolean;
  user1_username: string;
  user2_username: string;
}

declare interface FriendRequest {
  id: number;
  senderId: string;
  receiverId: string;
  createdAt: Date;
  notified: boolean;
  senderUsername: string;
  receiverUsername: string;
}

declare interface FriendStatusType {
  name: string;
}

declare interface Friendship {
  id: number;
  user_id: string;
  friend_id: string;
  created_at: Date;
  friend_username: string;
}

declare interface Stacks {
  id: number;
  name: string;
  ids: [];
  elements: [];
  center: {x: number, y: number};
  boardId: number;
  userId: string;
  createdAt: string;
  isSharing: string[];
};

type Prompt = {
  id: number;
  cue: string;
  content: string;
  theme: string;
  engagement: number;
  created_at: string,
  color?: string;
};



type GeographicalMode = 'city' | 'state' | 'country' | 'world'


type AlertProps = {
  title: string;
  message: string;
  type: string;
  status: "success" | "error" | "warning";
  duration?: number;
  onClose?: () => void;
  action?: () => void;
  actionText?: string;
  color?: string;
}

type Position = { top: number; left: number };

type RadioButtonProps = {
  label: string;
  selected: boolean;
  onSelect: () => void;
};


type TabItem = {
  name: string;
  key: string;
  color: string;
  notifications?: number;
};

type TabsContainerProps = {
  tabs?: TabItem[];
  selectedTab?: string;
  onTabChange?: (tabKey: string) => void;
  tabCount?: number;
};

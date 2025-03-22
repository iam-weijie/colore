import { TextInputProps, TouchableOpacityProps } from "react-native";

declare interface Post {
  id: number;
  clerk_id: string;
  user_id?: string; // this is supposed to be a temporary fix to prevent weird type mismatch errors
  firstname: string;
  username: string;
  content: string;
  created_at: string;
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
}

declare interface PostComment {
  id: number;
  post_id: number;
  user_id: string;
  sender_id: string;
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
    | "oauth";
  textVariant?:
    | "primary"
    | "default"
    | "secondary"
    | "danger"
    | "success"
    | "oauth";
  fontSize?: "sm" | "md" | "lg" | "xl";
  padding?: string;
  IconLeft?: React.ComponentType<any>;
  IconRight?: React.ComponentType<any>;
  className?: string;
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
  onSignOut?: () => void;
}

declare interface PostModalProps {
  isVisible: boolean;
  selectedPost: Post;
  handleCloseModal: () => void;
  invertedColors?: boolean;
  handleUpdate?: (isPinned: boolean) => void | Promise<void>;
  header: React.ReactElement;
  isPreview?: boolean;
}

declare interface UserPostsGalleryProps {
  posts: Post[];
}

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

type Stacks = {
  ids: [];
  elements: [];
};

type Prompt = {
  title: string;
  body: string;
  source: ImageSourcePropType;
};


declare interface ActionPromptsProps {
  friendName: string, 
  action: { name: string };
  handleAction: () => void;
}

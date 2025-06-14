import {
  ImageSourcePropType,
  TextInputProps,
  TouchableOpacityProps,
} from "react-native";
import * as Haptics from "expo-haptics"; // Import Haptics for the style type

declare interface Post {
  id: number;
  user_id: string;
  firstname: string;
  username: string;
  nickname: string;
  incognito_name: string;
  content: string;
  created_at: string;
  expires_at: string;
  available_at: string;
  static_emoji: boolean;
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
  formatting: Format[];
  formatting_encrypted?: string;
}

declare interface PostItBoardProps {
  userId: string;
  handlePostsRefresh: () => Promise<Post[]>;
  handleBack?: () => void;
  handleNewPostFetch: (excludeIds: number[]) => Promise<Post>; // do not refetch IDs
  handleUpdatePin: (ids: number[]) => void;
  allowStacking: boolean;
  showPostItText?: boolean;
  invertColors?: boolean;
  mode?: GeographicalMode;
  isEditable?: boolean;
  randomPostion: boolean;
}
declare interface UsePersonalPostsParams {
  userId: string;
  viewerId: string;
  boardId: number;
  isIpad: boolean;
  isOwnBoard: boolean;
  postRefIDs: number[];
  updatePinnedPosts?: boolean;
  setUpdatePinnedPosts?: (value: boolean) => void;
}

declare interface StylingType {
  id: number;
  bold?: boolean;
  italic?: boolean;
  underlinde?: boolean;
  orderedList?: boolean;
  underedList?: boolean;
  quote?: boolean;
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
  nickname: string;
  incognito_name: string;
  created_at: string;
  like_count: number;
  report_count: number;
  is_liked: boolean;
  postColor: string;
  reply_comment_id?: number | null;
}

declare interface PostLike {
  id: number;
  post_id: number;
  post_content: string;
  post_color: string;
  liker_username: string;
}

declare interface PostLike {
  id: number;
  post_id: number;
  post_content: string;
  post_color: string;
  liker_username: string;
}

declare interface UserProfileType {
  id: number;
  clerk_id: string;
  firstname: string;
  lastname: string;
  username: string;
  nickname: string;
  incognito_name: string;
  email: string;
  date_of_birth: string;
  city: string;
  state: string;
  country: string;
  device_token: string;
  is_paid_user: boolean;
  report_count: number;
  push_token: string;
  saved_posts: string[];
  theme: string;
  engagement: number;
  created_at: string,
  color?: string;
  total_posts?: number;
  shorthand_emojis?: string[];
  colors: PostItColor[];
  customizations?: any[];
}

declare interface UserData {
  userInfo: UserProfileType;
  posts: Post[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

declare interface PostWithPosition extends Post {
  position: {
    top: number;
    left: number;
  };
}

type Attribute = {
  class: string;
  level: number;
  description: string;
};
declare interface PostItColor {
  name: string;
  id: string;
  hex: string;
  rarity: string;
  SRB: number[];
  attributes?: Attribute;
  meaning: string;
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
    | "gradient3"
    | "gradient4"
    | "oauth";
  textVariant?:
    | "primary"
    | "default"
    | "secondary"
    | "danger"
    | "success"
    | "oauth";
  fontSize?: "sm" | "md" | "lg" | "xl" | "2xl"; // Added "2xl"
  padding?: number;
  IconLeft?: React.ComponentType<any>;
  IconRight?: React.ComponentType<any>;
  className?: string;
  // Haptic props removed, will be default behavior in CustomButton
}

declare interface UserPostsGalleryProps {
  posts: Post[];
  profileUserId: string;
  offsetY?: number;
  disableModal?: boolean;
  handleUpdate?: (id: number, isRemove?: boolean) => void;
  query?: string;
  header?: React.ReactElement;
  onLoadMore?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
}

declare interface UserProfileProps {
  userId: string;
  friendStatus: FriendStatusType;
  nickname?: string;
  tab: string;
  onSignOut?: () => void;
}

declare interface Format {
  start: number;
  end: number;
  type: TextStyle;
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
  seeComments?: boolean;
}

declare interface PostContainerProps {
  selectedPosts: Post[];
  handleCloseModal: () => void;
  invertedColors?: boolean;
  handleUpdate?: (isPinned: boolean) => void | Promise<void>;
  infiniteScroll?: boolean;
  header?: React.ReactElement;
  isPreview?: boolean;
  isShowCasing?: boolean;
  infiniteScroll?: boolean;
  scrollToLoad?: () => void;
  staticEmoji?: boolean;
  seeComments?: boolean;
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
  user1_nickname: string;
  user2_username: string;
  user2_nickname: string;
}

declare interface FriendRequest {
  id: number;
  senderId: string;
  receiverId: string;
  createdAt: Date;
  notified: boolean;
  senderUsername: string;
  senderNickname: string;
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
  friend_nickname: string;
  friend_incognito_name: string;
}

declare interface Stacks {
  id: number;
  name: string;
  ids: [];
  elements: [];
  center: { x: number; y: number };
  boardId: number;
  userId: string;
  createdAt: string;
  isSharing: string[];
}

type Prompt = {
  id: number;
  cue: string;
  content: string;
  theme: string;
  engagement: number;
  created_at: string;
  color?: string;
  item?: object;
};

type GeographicalMode = "city" | "state" | "country" | "world";

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
};

declare interface Position {
  top: number;
  left: number;
  rotate?: string;
}

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

type TextStyle =
  | "bold"
  | "italic"
  | "underline"
  | "H"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "ordered"
  | "unordered"
  | null;

declare interface EmojiData {
  id: string;
  emoji: string;
  categories: string[];
}

declare interface EmojiSelectorProps {
  onEmojiSelected: (emoji: string) => void;
  selectedEmoji?: string | null;
  mode?: "shorthand" | "library" | "both";
  showInModal?: boolean;
  isVisible?: boolean;
  onClose?: () => void;
}

declare interface EmojiShorthandProps {
  onEmojiSelected: (emoji: string) => void;
  selectedEmoji?: string | null;
  customShorthandEmojis?: string[];
}

declare interface EmojiLibraryProps {
  onEmojiSelected: (emoji: string) => void;
  selectedEmoji?: string | null;
}

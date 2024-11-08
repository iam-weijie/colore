import { TextInputProps, TouchableOpacityProps } from "react-native";

declare interface Post {
  id: string;
  clerk_id: string;
  firstname: string;
  username: string;
  content: string;
  created_at: string;
  city: string;
  state: string;
  country: string;
  like_count: number;
  report_count: number;
  color: string; //String for now. Should be changed to PostItColor
}

declare interface PostComment {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  firstname: string;
  username: string;
  created_at: string;
  like_count: number;
  report_count: number;
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
  is_paid_user: boolean;
  report_count: number;
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
  handleUpdate?: () => void | undefined | Promise<void>;
}

declare interface UserProfileProps {
  userId: string;
  onSignOut?: () => void;
}

declare interface PostModalProps {
  isVisible: boolean;
  post: Post | null;
  handleCloseModal: () => void;
  handleUpdate?: () => void | Promise<void>;
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

declare interface PaymentProps {
  fullName: string;
  email: string;
  amount: string;
}

declare interface ConversationItem {
  id: string;
  name: string;
  lastMessageContent: string;
  lastMessageTimestamp: Date;
}

declare interface ChatTabProps {}

declare interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
}

type UserNicknamePair = [string, string];

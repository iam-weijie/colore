import { TextInputProps, TouchableOpacityProps } from "react-native";

declare interface Post {
  id: string;
  clerk_id: string;
  firstname: string;
  content: string;
  created_date: Date;
  city: string;
  state: string;
  country: string;
  like_count: number;
  report_count: number;
}

declare interface UserProfileType {
  id: number;
  clerk_id: string;
  firstname: string;
  lastname: string;
  email: string;
  date_of_birth: Date;
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

declare interface NavigationContextType {
  stateVars: any;
  setStateVars: (state: any) => void;
}

declare interface ButtonProps extends TouchableOpacityProps {
  title: string;
  bgVariant?: "primary" | "secondary" | "danger" | "outline" | "success";
  textVariant?: "primary" | "default" | "secondary" | "danger" | "success";
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
  isEditable: boolean;
  onSignOut?: () => void;
}

declare interface PostModalProps {
  isVisible: boolean;
  post: Post | null;
  handleCloseModal: () => void;
  handleUpdate?: () => void | undefined | Promise<void>;
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

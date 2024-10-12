import { TextInputProps, TouchableOpacityProps } from "react-native";

declare interface User {
  id: number;
  first_name: string;
  last_name: string;
  birthday: Date;
  email: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  paid_member: boolean;
}

declare interface Post {
  id: string;
  clerk_id: string;
  firstname: string;
  content: string;
  created_date: Date;
  location: {
    city: string;
    state: string;
    country: string;
  };
  like_count: number;
  report_count: number;
}

declare interface UserProfileType {
  id: number;
  clerk_id: string;
  firstname: string;
  lastname: string;
  email: string;
  date_of_birth: string;
  city: string;
  state: string;
  country: string;
  is_paid_user: boolean;
  report_count: number;
}

declare interface UserData {
  userInfo: UserProfile;
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
  IconLeft?: React.ComponentType<any>;
  IconRight?: React.ComponentType<any>;
  className?: string;
}

declare interface UserPostsGalleryProps {
  posts: Post[];
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

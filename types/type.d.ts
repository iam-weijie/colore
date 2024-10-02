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
  user_id: number;
  post_id: string;
  first_name: string;
  content: string;
  created_date: Date;
  location: {
    city: string;
    state: string;
    country: string;
  };
  likes_count: number;
  reports_count: number;
}

declare interface ButtonProps extends TouchableOpacityProps {
  title: string;
  bgVariant?: "primary" | "secondary" | "danger" | "outline" | "success";
  textVariant?: "primary" | "default" | "secondary" | "danger" | "success";
  IconLeft?: React.ComponentType<any>;
  IconRight?: React.ComponentType<any>;
  className?: string;
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

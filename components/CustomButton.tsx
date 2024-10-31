import { Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ButtonProps } from "@/types/type";

const getBgVariantStyle = (variant: ButtonProps["bgVariant"], disabled: boolean) => {
  if (disabled) {
    return "bg-gray-400";
  }

  switch (variant) {
    case "secondary":
      return "bg-gray-500";
    case "danger":
      return "bg-red-500";
    case "success":
      return "bg-green-500";
    case "outline":
      return "bg-transparent border-neutral-300 border-[0.5px]";
    case "gradient":
      return ["#ffd12b", "#ff9f45"];
    case "oauth":
      return "bg-[#f4f9fa]";
    default:
      return "bg-[#333333]";
  }
};

const getTextVariantStyle = (variant: ButtonProps["textVariant"], disabled: boolean) => {
  if (disabled) {
    return "text-gray-300";
  }

  switch (variant) {
    case "primary":
      return "text-black";
    case "secondary":
      return "text-gray-100";
    case "danger":
      return "text-red-100";
    case "success":
      return "text-green-100";
    case "oauth":
      return "text-[#585c74]"
    default:
      return "text-white";
  }
};

const CustomButton = ({
  onPress,
  title,
  bgVariant = "primary",
  textVariant = "default",
  IconLeft,
  IconRight,
  className,
  disabled = false,
  fontSize = "lg",
  padding = "2",
  ...props
}: ButtonProps) => {
  const bgStyle = getBgVariantStyle(bgVariant, disabled);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`w-full  rounded-xl ${bgVariant === "gradient" ? "" : bgStyle} p-${bgVariant === "gradient" ? "" : padding} flex flex-row justify-center items-center shadow-sm shadow-neutral-300 ${className}`}
      {...props}
    >
      {bgVariant === "gradient" && Array.isArray(bgStyle) ? (
        <LinearGradient
          colors={bgStyle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className={`flex flex-row justify-center items-center w-full h-full p-${padding} rounded-xl`}
        >
          {IconLeft && <IconLeft />}
          <Text className={`text-${fontSize} ${getTextVariantStyle(textVariant, disabled)}`}>
            {title}
          </Text>
          {IconRight && <IconRight />}
        </LinearGradient>
      ) : (
        <>
          {IconLeft && <IconLeft />}
          <Text className={`font-bold text-${fontSize} ${getTextVariantStyle(textVariant, disabled)}`}>
            {title}
          </Text>
          {IconRight && <IconRight />}
        </>
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;

import { ButtonProps } from "@/types/type";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, TouchableOpacity } from "react-native";

const getBgVariantStyle = (
  variant: ButtonProps["bgVariant"],
  disabled: boolean
) => {
  if (disabled) {
    return "bg-gray-400";
  }

  switch (variant) {
    case "primary":
      return "bg-[#FFFFFF]"
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
    case "gradient2":
      return ["#54C1EE", "#91C5FC", "#54C1EE"];
    default:
      return "bg-[#333333]";
  }
};

const getTextVariantStyle = (
  variant: ButtonProps["textVariant"],
  disabled: boolean
) => {
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
  fontSize = "2xl",
  padding = "4",
  ...props
}: ButtonProps) => {
  const bgStyle = getBgVariantStyle(bgVariant, disabled);
 

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`w-full rounded-full ${["gradient", "gradient2"].includes(bgVariant) ? "" : bgStyle} p-${bgVariant === "gradient" ? "" : padding} flex flex-row justify-center items-center shadow-sm shadow-neutral-300 ${className}`}
      {...props}
    >
      {["gradient", "gradient2"].includes(bgVariant) && Array.isArray(bgStyle) ? (
        <LinearGradient
          colors={bgStyle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className={`flex flex-row justify-center items-center w-full h-full p-${padding} rounded-full`}
        >
          {IconLeft && <IconLeft />}
          <Text
            className={`font-bold text-${fontSize} ${getTextVariantStyle(textVariant, disabled)}`}
          >
            {title}
          </Text>
          {IconRight && <IconRight />}
        </LinearGradient>
      ) : (
        <>
          {IconLeft && <IconLeft />}
          <Text
            className={`font-bold text-${fontSize} ${getTextVariantStyle(textVariant, disabled)}`}
          >
            {title}
          </Text>
          {IconRight && <IconRight />}
        </>
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;

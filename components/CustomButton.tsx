import { ButtonProps } from "@/types/type";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, TouchableOpacity, Platform, ColorValue } from "react-native";

type BgStyleResult = string | readonly [ColorValue, ColorValue, ...ColorValue[]];

interface GradientOptions {
  isGradient: boolean;
  colors: readonly [ColorValue, ColorValue, ...ColorValue[]];
}

const getBgVariantStyle = (
  variant: ButtonProps["bgVariant"],
  disabled: boolean
): { style: string; gradient: GradientOptions | null } => {
  if (disabled) {
    return { style: "bg-gray-400", gradient: null };
  }

  switch (variant) {
    case "secondary":
      return { style: "bg-gray-500", gradient: null };
    case "danger":
      return { style: "bg-red-500", gradient: null };
    case "success":
      return { style: "bg-green-500", gradient: null };
    case "outline":
      return { style: "bg-transparent border-neutral-300 border-[0.5px]", gradient: null };
    case "gradient":
      return { 
        style: "", 
        gradient: {
          isGradient: true,
          colors: ["#ffd12b", "#ff9f45"] as readonly [ColorValue, ColorValue]
        }
      };
    case "gradient2":
      return { 
        style: "",
        gradient: {
          isGradient: true,
          colors: ["#54C1EE", "#91C5FC", "#54C1EE"] as readonly [ColorValue, ColorValue, ColorValue]
        }
      };
    default:
      return { style: "bg-[#333333]", gradient: null };
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
  activeOpacity = 0.8,
  ...props
}: ButtonProps) => {
  const { style: bgStyle, gradient } = getBgVariantStyle(bgVariant, disabled);
 
  // Set a fixed height for Android to ensure buttons are touchable
  const platformStyles = Platform.OS === 'android' ? {
    minHeight: 40,
    elevation: 2,
  } : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
      className={`w-full rounded-full ${bgStyle} p-${gradient ? "" : padding} flex flex-row justify-center items-center shadow-sm shadow-neutral-300 ${className}`}
      style={platformStyles}
      {...props}
    >
      {gradient ? (
        <LinearGradient
          colors={gradient.colors}
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

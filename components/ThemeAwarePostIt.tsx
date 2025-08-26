import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { usePostItColor } from "@/hooks/useTheme";
import { PostItColor } from "@/types/type";

interface ThemeAwarePostItProps {
  colorId: string;
  content: string;
  size?: "small" | "medium" | "large";
  showFold?: boolean;
}

export const ThemeAwarePostIt: React.FC<ThemeAwarePostItProps> = ({
  colorId,
  content,
  size = "medium",
  showFold = false,
}) => {
  const postItColor = usePostItColor(colorId);

  if (!postItColor) {
    return null;
  }

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return { width: 120, height: 120, padding: 12 };
      case "large":
        return { width: 200, height: 200, padding: 20 };
      default:
        return { width: 160, height: 160, padding: 16 };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.container,
        sizeStyles,
        {
          backgroundColor: postItColor.hex,
          borderColor: postItColor.foldcolorhex,
        },
      ]}
    >
      <Text
        style={[
          styles.content,
          {
            color: postItColor.fontColor,
            fontSize: size === "small" ? 12 : size === "large" ? 18 : 14,
          },
        ]}
        numberOfLines={size === "small" ? 6 : size === "large" ? 12 : 8}
      >
        {content}
      </Text>
      
      {showFold && (
        <View
          style={[
            styles.fold,
            {
              backgroundColor: postItColor.foldcolorhex,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: "relative",
  },
  content: {
    fontFamily: "Jakarta",
    lineHeight: 20,
    textAlign: "center",
  },
  fold: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: -1,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default ThemeAwarePostIt;

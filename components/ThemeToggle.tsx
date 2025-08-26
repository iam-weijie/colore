import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, useThemeToggle, ThemeType } from "@/app/contexts/ThemeContext";
import { useThemeColors, useTextColor, useBackgroundColor } from "@/hooks/useTheme";

const { width } = Dimensions.get("window");

interface ThemeToggleProps {
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = "medium",
  showLabel = false,
  className = "",
}) => {
  const { currentTheme, setTheme } = useTheme();
  const { toggleTheme } = useThemeToggle();
  const colors = useThemeColors();
  const textColor = useTextColor();
  const backgroundColor = useBackgroundColor("surface");
  const [showThemeModal, setShowThemeModal] = useState(false);

  const getIconSize = () => {
    switch (size) {
      case "small":
        return 16;
      case "large":
        return 28;
      default:
        return 22;
    }
  };

  const getContainerSize = () => {
    switch (size) {
      case "small":
        return 32;
      case "large":
        return 48;
      default:
        return 40;
    }
  };

  const getThemeIcon = (theme: ThemeType) => {
    switch (theme) {
      case "light":
        return "sunny";
      case "dark":
        return "moon";
      case "system":
        return "desktop";
      default:
        return "sunny";
    }
  };

  const getThemeLabel = (theme: ThemeType) => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
        return "System";
      default:
        return "Light";
    }
  };

  const handleThemeSelect = (theme: ThemeType) => {
    setTheme(theme);
    setShowThemeModal(false);
  };

  const isCurrentTheme = (theme: ThemeType) => currentTheme === theme;

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowThemeModal(true)}
        style={[
          styles.container,
          {
            width: getContainerSize(),
            height: getContainerSize(),
            backgroundColor: backgroundColor,
            borderColor: colors.border,
          },
        ]}
        className={className}
        activeOpacity={0.7}
      >
        <Ionicons
          name={getThemeIcon(currentTheme) as any}
          size={getIconSize()}
          color={textColor}
        />
        {showLabel && (
          <Text style={[styles.label, { color: textColor }]}>
            {getThemeLabel(currentTheme)}
          </Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowThemeModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: backgroundColor,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                Choose Theme
              </Text>
              <TouchableOpacity
                onPress={() => setShowThemeModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.themeOptions}>
              {(["light", "dark", "system"] as ThemeType[]).map((theme) => (
                <TouchableOpacity
                  key={theme}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isCurrentTheme(theme)
                        ? colors.primary
                        : backgroundColor,
                      borderColor: isCurrentTheme(theme)
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() => handleThemeSelect(theme)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={getThemeIcon(theme) as any}
                    size={24}
                    color={
                      isCurrentTheme(theme) ? "#FFFFFF" : textColor
                    }
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      {
                        color: isCurrentTheme(theme) ? "#FFFFFF" : textColor,
                      },
                    ]}
                  >
                    {getThemeLabel(theme)}
                  </Text>
                  {isCurrentTheme(theme) && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color="#FFFFFF"
                      style={styles.checkmark}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.8,
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  themeOptions: {
    gap: 12,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  checkmark: {
    marginLeft: "auto",
  },
});

export default ThemeToggle;

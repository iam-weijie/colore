import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import { lightThemeColors, darkThemeColors, semanticColors } from "@/constants/darkModeColors";

// Storage keys
const THEME_PREFERENCE_KEY = "themePreference";

// Theme types
export type ThemeType = "system";

// Theme context type
export type ThemeContextType = {
  currentTheme: ThemeType;
  isDark: boolean;
  colors: typeof lightThemeColors;
  systemColorScheme: "light" | "dark" | null;
};

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentTheme] = useState<ThemeType>("system");
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get system color scheme
  const systemColorScheme = useColorScheme();

  // Determine if we should use dark mode
  const isDark = systemColorScheme === "dark";

  // Get current colors based on theme
  const colors = isDark ? darkThemeColors : lightThemeColors;

  // Initialize theme
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Context value
  const contextValue: ThemeContextType = {
    currentTheme,
    isDark,
    colors,
    systemColorScheme,
  };

  // Don't render until theme is initialized to prevent flash
  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Hook to get just the colors
export const useThemeColors = () => {
  const { colors } = useTheme();
  return colors;
};

// Hook to check if dark mode is active
export const useIsDark = () => {
  const { isDark } = useTheme();
  return isDark;
};

// Hook to get current theme info
export const useThemeInfo = () => {
  const { currentTheme, isDark } = useTheme();
  return { currentTheme, isDark };
};

export default ThemeProvider;

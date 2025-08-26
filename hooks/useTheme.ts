import { useMemo } from "react";
import { useTheme, useIsDark } from "@/app/contexts/ThemeContext";
import { allColors } from "@/constants/colors";
import { getDarkModeColor, needsDarkModeAdaptation } from "@/constants/darkModeColors";
import { PostItColor } from "@/types/type";

/**
 * Hook to get PostIt color with automatic theme adaptation
 * @param colorId - The ID of the PostIt color
 * @returns The PostIt color adapted for the current theme
 */
export const usePostItColor = (colorId: string): PostItColor | null => {
  const isDark = useIsDark();
  
  return useMemo(() => {
    // Find the original color
    const originalColor = allColors.find(color => color.id === colorId);
    if (!originalColor) return null;

    // If it's dark mode, get the dark variant
    if (isDark) {
      const darkColor = getDarkModeColor(colorId);
      return darkColor || originalColor;
    }

    // If it's light mode, return the original
    return originalColor;
  }, [colorId, isDark]);
};

/**
 * Hook to get all PostIt colors adapted for the current theme
 * @returns Array of PostIt colors adapted for the current theme
 */
export const useAllPostItColors = (): PostItColor[] => {
  const isDark = useIsDark();
  
  return useMemo(() => {
    if (isDark) {
      // Return dark mode variants for all colors
      return allColors.map(color => {
        const darkColor = getDarkModeColor(color.id);
        return darkColor || color;
      });
    }
    
    // Return original colors for light mode
    return allColors;
  }, [isDark]);
};

/**
 * Hook to get a color that automatically adapts to theme
 * @param lightColor - Color to use in light mode
 * @param darkColor - Color to use in dark mode
 * @returns The appropriate color for the current theme
 */
export const useAdaptiveColor = (lightColor: string, darkColor: string): string => {
  const isDark = useIsDark();
  
  return useMemo(() => {
    return isDark ? darkColor : lightColor;
  }, [isDark, lightColor, darkColor]);
};

/**
 * Hook to get a PostIt color with custom theme adaptation
 * @param colorId - The ID of the PostIt color
 * @param customDarkHex - Custom dark mode hex color (optional)
 * @param customDarkFontColor - Custom dark mode font color (optional)
 * @returns The PostIt color with custom theme adaptation
 */
export const useCustomPostItColor = (
  colorId: string,
  customDarkHex?: string,
  customDarkFontColor?: string
): PostItColor | null => {
  const isDark = useIsDark();
  
  return useMemo(() => {
    const originalColor = allColors.find(color => color.id === colorId);
    if (!originalColor) return null;

    if (isDark) {
      // Create custom dark variant
      return {
        ...originalColor,
        hex: customDarkHex || originalColor.hex,
        fontColor: customDarkFontColor || originalColor.fontColor,
        foldcolorhex: originalColor.foldcolorhex, // Keep original fold color for now
      };
    }

    return originalColor;
  }, [colorId, isDark, customDarkHex, customDarkFontColor]);
};

/**
 * Hook to check if a color needs dark mode adaptation
 * @param hexColor - The hex color to check
 * @returns True if the color needs adaptation for dark mode
 */
export const useNeedsDarkModeAdaptation = (hexColor: string): boolean => {
  return useMemo(() => {
    return needsDarkModeAdaptation(hexColor);
  }, [hexColor]);
};

/**
 * Hook to get theme-aware background color
 * @param variant - Background variant ('primary', 'secondary', 'surface')
 * @returns The appropriate background color for the current theme
 */
export const useBackgroundColor = (variant: 'primary' | 'secondary' | 'surface' = 'primary'): string => {
  const { colors } = useTheme();
  
  return useMemo(() => {
    switch (variant) {
      case 'secondary':
        return colors.surfaceSecondary;
      case 'surface':
        return colors.surface;
      default:
        return colors.background;
    }
  }, [colors, variant]);
};

/**
 * Hook to get theme-aware text color
 * @param variant - Text variant ('primary', 'secondary', 'tertiary')
 * @returns The appropriate text color for the current theme
 */
export const useTextColor = (variant: 'primary' | 'secondary' | 'tertiary' = 'primary'): string => {
  const { colors } = useTheme();
  
  return useMemo(() => {
    switch (variant) {
      case 'secondary':
        return colors.textSecondary;
      case 'tertiary':
        return colors.textTertiary;
      default:
        return colors.text;
    }
  }, [colors, variant]);
};

/**
 * Hook to get theme-aware border color
 * @param variant - Border variant ('primary', 'secondary')
 * @returns The appropriate border color for the current theme
 */
export const useBorderColor = (variant: 'primary' | 'secondary' = 'primary'): string => {
  const { colors } = useTheme();
  
  return useMemo(() => {
    return variant === 'secondary' ? colors.borderSecondary : colors.border;
  }, [colors, variant]);
};

/**
 * Hook to get theme-aware status colors
 * @param status - Status type ('error', 'success', 'warning', 'info')
 * @returns The appropriate status color for the current theme
 */
export const useStatusColor = (status: 'error' | 'success' | 'warning' | 'info'): string => {
  const { colors } = useTheme();
  
  return useMemo(() => {
    switch (status) {
      case 'error':
        return colors.error;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
      default:
        return colors.primary;
    }
  }, [colors, status]);
};

/**
 * Hook to get theme-aware primary colors
 * @param variant - Primary variant ('main', 'light')
 * @returns The appropriate primary color for the current theme
 */
export const usePrimaryColor = (variant: 'main' | 'light' = 'main'): string => {
  const { colors } = useTheme();
  
  return useMemo(() => {
    return variant === 'light' ? colors.primaryLight : colors.primary;
  }, [colors, variant]);
};

/**
 * Hook to get theme-aware secondary colors
 * @param variant - Secondary variant ('main', 'light')
 * @returns The appropriate secondary color for the current theme
 */
export const useSecondaryColor = (variant: 'main' | 'light' = 'main'): string => {
  const { colors } = useTheme();
  
  return useMemo(() => {
    return variant === 'light' ? colors.secondaryLight : colors.secondary;
  }, [colors, variant]);
};

// Re-export theme context hooks for convenience
export {
  useTheme,
  useThemeColors,
  useIsDark,
  useThemeInfo,
} from "@/app/contexts/ThemeContext";

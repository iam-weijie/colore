import { PostItColor } from "@/types/type";

// Dark mode color mapping for PostIt colors
// Each color is carefully crafted to maintain the original's emotional impact
// while ensuring optimal contrast and readability on dark backgrounds

export const darkModeColorMap: Record<string, PostItColor> = {
  // Default colors
  "yellow": {
    name: "Yellow",
    id: "yellow",
    hex: "#FFD700", // Brighter yellow for dark backgrounds
    rarity: "default",
    foldcolorhex: "#FFE55C", // Brighter fold color
    SRB: [0, 0, 0],
    meaning: "",
    fontColor: "#8B6914", // Darker font for better contrast
  },
  "pink": {
    name: "Pink",
    id: "pink",
    hex: "#FF69B4", // Hot pink for better visibility
    rarity: "default",
    foldcolorhex: "#FF8DC7", // Brighter fold color
    SRB: [0, 0, 0],
    meaning: "",
    fontColor: "#8B0A50", // Darker font for better contrast
  },
  "light-blue": {
    name: "Light Blue",
    id: "light-blue",
    hex: "#87CEEB", // Sky blue for better visibility
    rarity: "default",
    foldcolorhex: "#B0E0E6", // Brighter fold color
    SRB: [0, 0, 0],
    meaning: "",
    fontColor: "#1E3A8A", // Darker font for better contrast
  },

  // Special colors with enhanced dark mode variants
  "baby-purple": {
    name: "Baby Purple",
    id: "baby-purple",
    hex: "#DDA0DD", // Plum for better visibility
    rarity: "default",
    foldcolorhex: "#E6C3E6", // Brighter fold color
    SRB: [0, 0, 0],
    meaning: "A mind that is oriented towards discovery, a pioneer.",
    attributes: {
      class: "Curious",
      level: 1,
      description: "A soft and calming color, perfect for gentle reminders.",
    },
    fontColor: "#6B46C1", // Darker font for better contrast
  },

  "scarlet-surge": {
    id: "scarlet-surge",
    name: "Scarlet Surge",
    hex: "#FF6B6B", // Brighter scarlet for dark backgrounds
    rarity: "Rare",
    foldcolorhex: "#FF8E8E", // Brighter fold color
    fontColor: "#000000", // Keep black font for contrast
    SRB: [30, 20, 50],
    meaning: "One who demands attention.",
    attributes: {
      class: "Dominant",
      level: 2,
      description: "Users who post bold, attention-grabbing content.",
    },
  },

  "blush-harmony": {
    id: "blush-harmony",
    name: "Blush Harmony",
    hex: "#FFB6C1", // Light pink for better visibility
    rarity: "Uncommon",
    foldcolorhex: "#FFC0CB", // Brighter fold color
    fontColor: "#000000", // Keep black font for contrast
    SRB: [25, 50, 25],
    meaning: "One who creates safe spaces.",
    attributes: {
      class: "Empathy",
      level: 2,
      description: "Supportive users who foster emotional warmth.",
    },
  },

  "zenith-clarity": {
    id: "zenith-clarity",
    name: "Zenith Clarity",
    hex: "#4FC3F7", // Brighter blue for dark backgrounds
    rarity: "Common",
    foldcolorhex: "#81D4FA", // Brighter fold color
    fontColor: "#000000", // Keep black font for contrast
    SRB: [45, 30, 25],
    meaning: "One who ensures peaceful dialogue.",
    attributes: {
      class: "Trust",
      level: 1,
      description: "Communicators who prioritize clear, uplifting discussions",
    },
  },

  "tidal-muse": {
    id: "tidal-muse",
    name: "Tidal Muse",
    hex: "#4DD0E1", // Brighter cyan for dark backgrounds
    rarity: "Epic",
    foldcolorhex: "#80DEEA", // Brighter fold color
    fontColor: "#000000", // Keep black font for contrast
    SRB: [15, 65, 20],
    meaning: "One who defines art.",
    attributes: {
      class: "Modern",
      level: 3,
      description: "An artist with unique aesthetics.",
    },
  },

  "verdant-revival": {
    id: "verdant-revival",
    name: "Verdant Revival",
    hex: "#66BB6A", // Brighter green for dark backgrounds
    rarity: "Uncommon",
    foldcolorhex: "#A5D6A7", // Brighter fold color
    fontColor: "#000000", // Keep black font for contrast
    SRB: [30, 20, 50],
    meaning: "One who mentors and renews.",
    attributes: {
      class: "Growth",
      level: 2,
      description: "Users who revive old threads or mentor newcomers.",
    },
  },

  "solar-spark": {
    id: "solar-spark",
    name: "Solar Spark",
    hex: "#FFB74D", // Brighter orange for dark backgrounds
    rarity: "Rare",
    foldcolorhex: "#FFCC80", // Brighter fold color
    fontColor: "#000000", // Keep black font for contrast
    SRB: [40, 30, 30],
    meaning: "One who sparks adventures.",
    attributes: {
      class: "Vitality",
      level: 2,
      description: "Trendsetters who initiate challenges.",
    },
  },

  "mirth-sprout": {
    id: "mirth-sprout",
    name: "Mirth Sprout",
    hex: "#9CCC65", // Brighter green for dark backgrounds
    rarity: "Uncommon",
    foldcolorhex: "#C5E1A5", // Brighter fold color
    fontColor: "#000000", // Keep black font for contrast
    SRB: [10, 70, 20],
    meaning: "One who plays with curiosity.",
    attributes: {
      class: "Whimsy",
      level: 3,
      description: "Curious users who test new features.",
    },
  },

  "gilded-hearth": {
    id: "gilded-hearth",
    name: "Gilded Hearth",
    hex: "#FFD54F", // Brighter gold for dark backgrounds
    rarity: "Legendary",
    foldcolorhex: "#FFE082", // Brighter fold color
    fontColor: "#B8860B", // Darker font for better contrast
    SRB: [55, 25, 20],
    meaning: "One who comforts through memory.",
    attributes: {
      class: "Warmth",
      level: 3,
      description: "Users sharing personal stories and nostalgic content.",
    },
  },

  "luna-veil": {
    id: "luna-veil",
    name: "Luna Veil",
    hex: "#E1BEE7", // Brighter lavender for dark backgrounds
    rarity: "Epic",
    foldcolorhex: "#F3E5F5", // Brighter fold color
    fontColor: "#000000", // Keep black font for contrast
    SRB: [10, 60, 30],
    meaning: "One who dreams in verse.",
    attributes: {
      class: "Spiritual",
      level: 3,
      description: "Dreamy creators with poetic or astrological themes.",
    },
  },

  "crimson-whisper": {
    id: "crimson-whisper",
    name: "Crimson Whisper",
    hex: "#E91E63", // Brighter crimson for dark backgrounds
    rarity: "Rare",
    foldcolorhex: "#F48FB1", // Brighter fold color
    fontColor: "#FFFFFF", // Keep white font for contrast
    SRB: [25, 40, 35],
    meaning: "One who speaks from the soul.",
    attributes: {
      class: "Intimate",
      level: 2,
      description: "Users posting emotionally raw or sensual content.",
    },
  },

  "terracotta-flame": {
    id: "terracotta-flame",
    name: "Terracotta Flame",
    hex: "#FF7043", // Brighter terracotta for dark backgrounds
    rarity: "Rare",
    foldcolorhex: "#FFAB91", // Brighter fold color
    fontColor: "#FFFFFF", // Keep white font for contrast
    SRB: [50, 25, 25],
    meaning: "One who transforms through journey.",
    attributes: {
      class: "Earthbound",
      level: 2,
      description: "Adventure seekers sharing transformative experiences.",
    },
  },

  "oak-resolve": {
    id: "oak-resolve",
    name: "Oak Resolve",
    hex: "#FFB74D", // Brighter orange for dark backgrounds
    rarity: "Legendary",
    foldcolorhex: "#FFCC80", // Brighter fold color
    fontColor: "#8B4513", // Darker font for better contrast
    SRB: [60, 15, 25],
    meaning: "One who anchors wisdom.",
    attributes: {
      class: "Foundation",
      level: 3,
      description: "Advice givers and long-form writers.",
    },
  },

  "jade-depth": {
    id: "jade-depth",
    name: "Jade Depth",
    hex: "#4DB6AC", // Brighter teal for dark backgrounds
    rarity: "Rare",
    foldcolorhex: "#80CBC4", // Brighter fold color
    fontColor: "#FFFFFF", // Keep white font for contrast
    SRB: [40, 40, 20],
    meaning: "One who balances community.",
    attributes: {
      class: "Mediator",
      level: 2,
      description: "Users who bridge communities or mediate conflicts.",
    },
  },

  "misty-logic": {
    id: "misty-logic",
    name: "Misty Logic",
    hex: "#BDBDBD", // Brighter gray for dark backgrounds
    rarity: "Common",
    foldcolorhex: "#E0E0E0", // Brighter fold color
    fontColor: "#000000", // Keep black font for contrast
    SRB: [35, 35, 30],
    meaning: "One who trusts in reason.",
    attributes: {
      class: "Analytic",
      level: 1,
      description: "Users who post data- or fact-based content.",
    },
  },

  "royal-vision": {
    id: "royal-vision",
    name: "Royal Vision",
    hex: "#7C4DFF", // Brighter purple for dark backgrounds
    rarity: "Epic",
    foldcolorhex: "#B39DDB", // Brighter fold color
    fontColor: "#FFFFFF", // Keep white font for contrast
    SRB: [30, 40, 50],
    meaning: "One who inspires ambition.",
    attributes: {
      class: "Innovator",
      level: 3,
      description: "Aspirational users sharing success stories.",
    },
  },

  "abyssal-insight": {
    id: "abyssal-insight",
    name: "Abyssal Insight",
    hex: "#1976D2", // Brighter blue for dark backgrounds
    rarity: "Legendary",
    foldcolorhex: "#64B5F6", // Brighter fold color
    fontColor: "#FFFFFF", // Keep white font for contrast
    SRB: [50, 20, 60],
    meaning: "One who dives into depth.",
    attributes: {
      class: "Expert",
      level: 3,
      description: "Users posting niche expertise with stability.",
    },
  },
};

// Base theme colors for the app
export const lightThemeColors = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceSecondary: "#F1F3F4",
  text: "#1A1A1A",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  border: "#E5E7EB",
  borderSecondary: "#D1D5DB",
  primary: "#3B82F6",
  primaryLight: "#60A5FA",
  secondary: "#6B7280",
  secondaryLight: "#9CA3AF",
  error: "#EF4444",
  errorLight: "#F87171",
  success: "#10B981",
  successLight: "#34D399",
  warning: "#F59E0B",
  warningLight: "#FBBF24",
  info: "#06B6D4",
  infoLight: "#22D3EE",
  overlay: "rgba(0, 0, 0, 0.5)",
  shadow: "rgba(0, 0, 0, 0.1)",
};

export const darkThemeColors = {
  background: "#0F0F0F",
  surface: "#FAFAFA",
  surfaceSecondary: "#262626",
  text: "#FFFFFF",
  textSecondary: "#E5E7EB",
  textTertiary: "#9CA3AF",
  border: "#374151",
  borderSecondary: "#4B5563",
  primary: "#60A5FA",
  primaryLight: "#93C5FD",
  secondary: "#9CA3AF",
  secondaryLight: "#D1D5DB",
  error: "#F87171",
  errorLight: "#FCA5A5",
  success: "#34D399",
  successLight: "#6EE7B7",
  warning: "#FBBF24",
  warningLight: "#FCD34D",
  info: "#22D3EE",
  infoLight: "#67E8F9",
  overlay: "rgba(0, 0, 0, 0.7)",
  shadow: "rgba(0, 0, 0, 0.3)",
};

// Semantic color tokens that automatically adapt to theme
export const semanticColors = {
  light: lightThemeColors,
  dark: darkThemeColors,
};

// Helper function to get dark mode equivalent of a PostIt color
export const getDarkModeColor = (colorId: string): PostItColor | null => {
  return darkModeColorMap[colorId] || null;
};

// Helper function to check if a color needs dark mode adaptation
export const needsDarkModeAdaptation = (hexColor: string): boolean => {
  // Simple heuristic: if the color is too dark, it might need adaptation
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate perceived brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // If brightness is below 128, consider it "dark" and needing adaptation
  return brightness < 128;
};

// Helper function to calculate contrast ratio
export const calculateContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (hex: string): number => {
    const hexColor = hex.replace("#", "");
    const r = parseInt(hexColor.substr(0, 2), 16) / 255;
    const g = parseInt(hexColor.substr(2, 2), 16) / 255;
    const b = parseInt(hexColor.substr(4, 2), 16) / 255;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      if (c <= 0.03928) return c / 12.92;
      return Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

// Helper function to ensure accessibility compliance
export const ensureAccessibility = (backgroundColor: string, textColor: string): boolean => {
  const contrastRatio = calculateContrastRatio(backgroundColor, textColor);
  // WCAG 2.1 AA requires 4.5:1 for normal text
  return contrastRatio >= 4.5;
};

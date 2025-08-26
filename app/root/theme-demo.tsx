import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useThemeColors, useBackgroundColor, useTextColor, usePostItColor, useAllPostItColors } from "@/hooks/useTheme";
import { useThemeInfo } from "@/hooks/useTheme";
import ThemeAwarePostIt from "@/components/ThemeAwarePostIt";
import Header from "@/components/Header";

const ThemeDemo = () => {
  const colors = useThemeColors();
  const backgroundColor = useBackgroundColor();
  const textColor = useTextColor();
  const { currentTheme, isDark } = useThemeInfo();
  const allColors = useAllPostItColors();

  const colorExamples = [
    { id: "yellow", content: "Bright & Cheerful" },
    { id: "pink", content: "Soft & Playful" },
    { id: "light-blue", content: "Calm & Clear" },
    { id: "scarlet-surge", content: "Bold & Attention-Grabbing" },
    { id: "zenith-clarity", content: "Trust & Communication" },
    { id: "royal-vision", content: "Innovation & Ambition" },
  ];

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Header title="Theme Demo" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Theme Info Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Theme Information
          </Text>
          <Text style={[styles.currentTheme, { color: colors.textSecondary }]}>
            Current Theme: {currentTheme} ({isDark ? 'Dark' : 'Light'})
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Theme automatically follows your system preference
          </Text>
        </View>

        {/* Color Palette Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Color Palette
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            These colors automatically adapt to the current theme
          </Text>
          
          <View style={styles.colorGrid}>
            <View style={[styles.colorItem, { backgroundColor: colors.primary }]}>
              <Text style={styles.colorLabel}>Primary</Text>
            </View>
            <View style={[styles.colorItem, { backgroundColor: colors.secondary }]}>
              <Text style={styles.colorLabel}>Secondary</Text>
            </View>
            <View style={[styles.colorItem, { backgroundColor: colors.success }]}>
              <Text style={styles.colorLabel}>Success</Text>
            </View>
            <View style={[styles.colorItem, { backgroundColor: colors.error }]}>
              <Text style={styles.colorLabel}>Error</Text>
            </View>
            <View style={[styles.colorItem, { backgroundColor: colors.warning }]}>
              <Text style={styles.colorLabel}>Warning</Text>
            </View>
            <View style={[styles.colorItem, { backgroundColor: colors.info }]}>
              <Text style={styles.colorLabel}>Info</Text>
            </View>
          </View>
        </View>

        {/* PostIt Colors Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            PostIt Colors
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Each PostIt color has a dark mode variant that maintains its personality
          </Text>
          
          <View style={styles.postItGrid}>
            {colorExamples.map((example) => (
              <View key={example.id} style={styles.postItContainer}>
                <ThemeAwarePostIt
                  colorId={example.id}
                  content={example.content}
                  size="small"
                  showFold
                />
                <Text style={[styles.postItLabel, { color: colors.textSecondary }]}>
                  {example.id}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* All Colors Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            All Available Colors
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {allColors.length} colors available with automatic theme adaptation
          </Text>
          
          <View style={styles.allColorsGrid}>
            {allColors.slice(0, 12).map((color) => (
              <View
                key={color.id}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color.hex },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Usage Examples Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Usage Examples
          </Text>
          
          <View style={styles.codeExample}>
            <Text style={[styles.codeTitle, { color: colors.primary }]}>
              Using Theme Colors:
            </Text>
            <Text style={[styles.codeText, { color: colors.textSecondary }]}>
              const colors = useThemeColors();{'\n'}
              const backgroundColor = useBackgroundColor();{'\n'}
              const textColor = useTextColor();
            </Text>
          </View>

          <View style={styles.codeExample}>
            <Text style={[styles.codeTitle, { color: colors.primary }]}>
              Using PostIt Colors:
            </Text>
            <Text style={[styles.codeText, { color: colors.textSecondary }]}>
              const postItColor = usePostItColor('yellow');{'\n'}
              // Automatically adapts to theme
            </Text>
          </View>

          <View style={styles.codeExample}>
            <Text style={[styles.codeTitle, { color: colors.primary }]}>
              Theme Info:
            </Text>
            <Text style={[styles.codeText, { color: colors.textSecondary }]}>
              const { currentTheme, isDark } = useThemeInfo();
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  themeToggleContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  currentTheme: {
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  colorItem: {
    width: "48%",
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  colorLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  postItGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  postItContainer: {
    alignItems: "center",
    width: "48%",
  },
  postItLabel: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
    textTransform: "capitalize",
  },
  allColorsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  codeExample: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  codeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  codeText: {
    fontSize: 14,
    fontFamily: "monospace",
    lineHeight: 20,
  },
});

export default ThemeDemo;

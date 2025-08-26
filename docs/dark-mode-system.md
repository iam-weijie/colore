# Dark Mode System Documentation

## Overview
This document outlines the comprehensive dark mode system for the Colore app, including design principles, color mapping, and implementation guidelines.

## Design Principles

### 1. Accessibility First
- Maintain WCAG 2.1 AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Ensure colors remain distinguishable for users with color vision deficiencies
- Preserve the emotional and psychological impact of colors in both themes

### 2. Brand Consistency
- Maintain the app's playful and creative personality in both light and dark modes
- Preserve color meanings and attributes across themes
- Ensure PostIt colors remain vibrant and engaging

### 3. User Experience
- Smooth transitions between themes
- Consistent visual hierarchy
- Reduced eye strain in low-light conditions

## Color Mapping Strategy

### Base Colors
The system uses semantic color tokens that automatically adapt to the current theme:

- `background`: Main app background
- `surface`: Card and component backgrounds
- `primary`: Primary brand colors
- `secondary`: Secondary actions and accents
- `text`: Primary text color
- `textSecondary`: Secondary text color
- `border`: Dividers and borders
- `error`: Error states and warnings
- `success`: Success states
- `warning`: Warning states

### PostIt Color Adaptation
Each PostIt color has a dark mode equivalent that:
- Maintains the same emotional impact
- Preserves readability and contrast
- Keeps the color's unique personality
- Adapts to dark backgrounds while remaining vibrant

### Color Transformation Rules
1. **Light to Dark**: Increase brightness and saturation for better visibility
2. **Dark to Light**: Decrease brightness and adjust saturation for optimal contrast
3. **Maintain Hue**: Preserve the original color's emotional characteristics
4. **Accessibility**: Ensure all colors meet contrast requirements

## Implementation

### Theme Context
The `ThemeContext` provides:
- Current theme state (system only)
- Automatic system preference detection
- System theme adaptation

### Color Hooks
- `useThemeColors()`: Access current theme's color palette
- `usePostItColor()`: Get PostIt color with theme adaptation
- `useThemeInfo()`: Get current theme information

### Component Integration
Components automatically adapt to theme changes using:
- Tailwind CSS classes with theme variants
- Dynamic color props
- Theme-aware styling

## Usage Examples

### Basic Theme Usage
```tsx
import { useThemeColors } from '@/hooks/useTheme';

function MyComponent() {
  const colors = useThemeColors();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello World</Text>
    </View>
  );
}
```

### PostIt Color Usage
```tsx
import { usePostItColor } from '@/hooks/useTheme';

function PostIt({ colorId }) {
  const postItColor = usePostItColor(colorId);
  
  return (
    <View style={{ backgroundColor: postItColor.hex }}>
      <Text style={{ color: postItColor.fontColor }}>Content</Text>
    </View>
  );
}
```

### Theme Info
```tsx
import { useThemeInfo } from '@/hooks/useTheme';

function ThemeInfo() {
  const { currentTheme, isDark } = useThemeInfo();
  
  return (
    <Text>
      Current: {currentTheme} ({isDark ? 'Dark' : 'Light'})
    </Text>
  );
}
```

## Color Palette

### Light Theme
- Background: #FFFFFF
- Surface: #F8F9FA
- Text: #1A1A1A
- Text Secondary: #6B7280
- Border: #E5E7EB
- Primary: #3B82F6
- Secondary: #6B7280

### Dark Theme
- Background: #0F0F0F
- Surface: #1A1A1A
- Text: #FFFFFF
- Text Secondary: #9CA3AF
- Border: #374151
- Primary: #60A5FA
- Secondary: #9CA3AF

## Migration Guide

### For Existing Components
1. Replace hardcoded colors with theme-aware alternatives
2. Use `useThemeColors()` hook for dynamic colors
3. Update Tailwind classes to use theme variants
4. Test contrast ratios in both themes

### For New Components
1. Design with both themes in mind from the start
2. Use semantic color tokens instead of specific hex values
3. Implement theme-aware styling patterns
4. Test accessibility in both themes

## Testing

### Visual Testing
- Test both themes in various lighting conditions
- Verify color contrast meets accessibility standards
- Ensure PostIt colors remain distinguishable
- Check for any visual glitches during theme transitions

### Accessibility Testing
- Use contrast checkers to verify ratios
- Test with screen readers
- Verify color-blind friendly design
- Check focus indicators in both themes

## Future Enhancements

### Planned Features
- Custom theme creation
- Color temperature preferences
- Automatic theme scheduling
- High contrast mode
- Reduced motion preferences

### Performance Considerations
- Lazy loading of theme assets
- Optimized color calculations
- Minimal re-renders during theme changes
- Efficient storage of theme preferences

## Troubleshooting

### Common Issues
1. **Colors not updating**: Check if component is wrapped in ThemeProvider
2. **Flash of wrong theme**: Ensure theme is loaded before rendering
3. **Poor contrast**: Verify color mapping follows accessibility guidelines
4. **Performance issues**: Check for unnecessary re-renders in theme context

### Debug Tools
- Theme debug panel in development
- Color contrast analyzer
- Theme state logging
- Performance monitoring

## Contributing

When adding new colors or modifying the theme system:
1. Follow the established color mapping patterns
2. Test in both themes
3. Verify accessibility compliance
4. Update documentation
5. Add appropriate tests

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Color System](https://material.io/design/color/the-color-system.html)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Dark Theme](https://material.io/design/color/dark-theme.html)

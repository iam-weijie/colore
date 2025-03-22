import React, { useEffect, useRef, useState } from 'react';
import { Text, View, Animated, Easing, StyleSheet, LayoutChangeEvent } from 'react-native';
import { isNameTooLong } from './cacheStore';

interface ScrollingTextProps {
  text: string;
  style?: any;
  containerStyle?: any;
  scrollSpeed?: number;
  delay?: number;
  maxLength?: number;
}

const ScrollingText: React.FC<ScrollingTextProps> = ({
  text,
  style,
  containerStyle,
  scrollSpeed = 50, // Pixels per second
  delay = 1000, // Delay before scrolling starts
  maxLength = 12,
}) => {
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const [needsScrolling, setNeedsScrolling] = useState(false);

  // Measure container width
  const onContainerLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  // Measure text width
  const onTextLayout = (e: LayoutChangeEvent) => {
    setTextWidth(e.nativeEvent.layout.width);
  };

  // Start animation when component mounts or when measurements change
  useEffect(() => {
    // Only animate if text is too long and container is measured
    if (containerWidth > 0 && textWidth > 0) {
      // Determine if scrolling is needed
      const shouldScroll = textWidth > containerWidth && isNameTooLong(text, maxLength);
      setNeedsScrolling(shouldScroll);
      
      if (shouldScroll) {
        // Calculate animation duration based on text length and speed
        const animDuration = (textWidth * 1000) / scrollSpeed;
        
        // Reset animation value
        scrollAnim.setValue(0);
        
        // Create scrolling animation
        Animated.sequence([
          // Initial delay
          Animated.delay(delay),
          // Scroll from start to end
          Animated.timing(scrollAnim, {
            toValue: -(textWidth - containerWidth),
            duration: animDuration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          // Pause at the end
          Animated.delay(delay),
          // Return to start
          Animated.timing(scrollAnim, {
            toValue: 0,
            duration: 1000, // Quick reset
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Loop the animation
          scrollAnim.setValue(0);
          Animated.loop(
            Animated.sequence([
              // Initial delay
              Animated.delay(delay),
              // Scroll from start to end
              Animated.timing(scrollAnim, {
                toValue: -(textWidth - containerWidth),
                duration: animDuration,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              // Pause at the end
              Animated.delay(delay),
              // Return to start
              Animated.timing(scrollAnim, {
                toValue: 0,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              // Pause at the start
              Animated.delay(delay),
            ])
          ).start();
        });
      }
    }
    
    return () => {
      // Clean up animation when component unmounts
      scrollAnim.stopAnimation();
    };
  }, [text, textWidth, containerWidth, scrollAnim, delay, scrollSpeed, maxLength]);

  return (
    <View 
      style={[styles.container, containerStyle]} 
      onLayout={onContainerLayout}
    >
      <Animated.Text 
        style={[
          styles.text,
          style,
          needsScrolling ? { transform: [{ translateX: scrollAnim }] } : null,
        ]} 
        onLayout={onTextLayout}
        numberOfLines={1}
      >
        {text}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flex: 1,
  },
  text: {
    // Default text styling
  },
});

export default ScrollingText; 
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface RecentEmojiPopupProps {
  visible: boolean;
  recentEmojis: string[];
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  triggerPosition: { x: number; y: number };
  activeIndex?: number;
}

const RecentEmojiPopup: React.FC<RecentEmojiPopupProps> = ({
  visible,
  recentEmojis,
  onEmojiSelect,
  onClose,
  triggerPosition,
  activeIndex = -1,
}) => {
  // Local visibility state to handle animation completion
  const [localVisible, setLocalVisible] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  
  // Individual emoji item animations
  const emojiAnims = useRef(
    Array(6).fill(0).map(() => new Animated.Value(0))
  ).current;
  
  // Screen dimensions for positioning
  const screenWidth = Dimensions.get('window').width;
  
  // Ref to track if we're currently animating out
  const isAnimatingOut = useRef(false);
  
  // Handle controlled visibility state
  useEffect(() => {
    if (visible && !localVisible) {
      // Show immediately
      setLocalVisible(true);
      isAnimatingOut.current = false;
    } else if (!visible && localVisible && !isAnimatingOut.current) {
      // Start exit animation but keep component mounted
      animateOut();
    }
  }, [visible, localVisible]);
  
  // Run animations when local visibility changes
  useEffect(() => {
    if (localVisible) {
      // Provide haptic feedback when popup appears
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Reset animation values
      translateYAnim.setValue(20);
      scaleAnim.setValue(0.8);
      fadeAnim.setValue(0);
      emojiAnims.forEach(anim => anim.setValue(0));
      
      // Create container animation sequence
      const containerAnimation = Animated.sequence([
        // First pop out the container
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true
          }),
          Animated.spring(scaleAnim, {
            toValue: 1.05, // Slightly overshoot
            tension: 230,
            friction: 16,
            useNativeDriver: true
          }),
          Animated.spring(translateYAnim, {
            toValue: 0,
            tension: 250,
            friction: 18,
            useNativeDriver: true
          })
        ]),
        // Then settle to final size
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 180,
          friction: 12,
          useNativeDriver: true
        })
      ]);
      
      // Create staggered animations for emoji items
      const emojiAnimations = Animated.stagger(
        30, // Stagger by 30ms
        emojiAnims.map(anim => 
          Animated.spring(anim, {
            toValue: 1,
            tension: 250,
            friction: 16,
            useNativeDriver: true
          })
        )
      );
      
      // Start all animations
      containerAnimation.start();
      emojiAnimations.start();
    }
  }, [localVisible]);

  // Function to handle exit animation
  const animateOut = () => {
    isAnimatingOut.current = true;
    
    // Animate emoji items out first (reverse stagger)
    const emojiOutAnimations = Animated.stagger(
      20, 
      [...emojiAnims].reverse().map(anim => 
        Animated.timing(anim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true
        })
      )
    );
    
    // Then animate the container out
    const containerOutAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(translateYAnim, {
        toValue: 15,
        duration: 200,
        useNativeDriver: true
      })
    ]);
    
    // Run animations in sequence
    Animated.sequence([
      emojiOutAnimations,
      containerOutAnimation
    ]).start(({ finished }) => {
      if (finished) {
        // Animation completed, now unmount component
        setLocalVisible(false);
        isAnimatingOut.current = false;
      }
    });
  };

  // Handle emoji selection with animated exit
  const handleEmojiSelect = (emoji: string) => {
    // Start exit animation
    animateOut();
    
    // Call the emoji select handler after a small delay
    setTimeout(() => {
      onEmojiSelect(emoji);
    }, 100);
  };

  // Don't render if not locally visible or no emojis
  if (!localVisible || recentEmojis.length === 0) return null;

  // Calculate position - ensure popup doesn't go off screen
  const popupWidth = 56; // Width of the popup
  let xPosition = triggerPosition.x - popupWidth / 2;
  
  // Adjust if would go off screen
  if (xPosition < 10) xPosition = 10;
  if (xPosition + popupWidth > screenWidth - 10) xPosition = screenWidth - popupWidth - 10;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.container,
          {
            left: xPosition,
            top: triggerPosition.y,
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: translateYAnim }
            ]
          }
        ]}
      >
        {recentEmojis.slice(0, 6).map((emoji, index) => (
          <Animated.View 
            key={`emoji-container-${index}`}
            style={{
              opacity: emojiAnims[index],
              transform: [
                { 
                  scale: emojiAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  }) 
                },
                { 
                  translateY: emojiAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0]
                  }) 
                }
              ]
            }}
          >
            <TouchableOpacity
              style={[
                styles.emojiItem,
                activeIndex === index && styles.activeEmojiItem
              ]}
              onPress={() => handleEmojiSelect(emoji)}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </Animated.View>
      
      {/* Invisible backdrop for closing popup when tapping outside */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={() => {
          animateOut();
          setTimeout(onClose, 300);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  container: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 8,
    width: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 1000,
  },
  emojiItem: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 12
  },
  activeEmojiItem: {
    backgroundColor: '#DBEAFE'
  },
  emojiText: {
    fontSize: 24
  }
});

export default RecentEmojiPopup;

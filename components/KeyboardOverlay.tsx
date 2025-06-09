import React, { useEffect, useState, useRef } from 'react';
import {
  Keyboard,
  KeyboardEvent,
  View,
  LayoutAnimation,
  Platform,
  Animated,
} from 'react-native';

interface KeyboardOverlayProps {
  children: React.ReactNode;
  offsetY?: number;
  onFocus?: boolean;
}

const KeyboardOverlay: React.FC<KeyboardOverlayProps> = ({ 
  children, 
  offsetY = 0, 
  onFocus = false 
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isVisible, setIsVisible] = useState(onFocus);
  
  // Use useRef instead of useState for Animated.Value
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isMountedRef = useRef(true);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => {
        if (!isMountedRef.current) return;
        
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardHeight(e.endCoordinates.height);
        
        // Delay the appearance to let keyboard slide in
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setIsVisible(true);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }, Platform.OS === 'ios' ? 100 : 50); // iOS keyboard animation is slower
      }
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }).start(() => {
          // Check if component is still mounted before updating state
          if (isMountedRef.current) {
            setIsVisible(false);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setKeyboardHeight(0);
          }
        });
      }
    );

    return () => {
      isMountedRef.current = false;
      showSub.remove();
      hideSub.remove();
    };
  }, [fadeAnim]);

  return (
    <Animated.View
      className="absolute left-0 right-0 bg-white h-[60px] shadow-md z-50 rounded-t-[32px]"
      style={{
        ...(offsetY > 0
          ? { top: offsetY + keyboardHeight - 70 }
          : { bottom: keyboardHeight }),
        paddingHorizontal: 12,
        paddingVertical: 8,
        opacity: fadeAnim,
        transform: [
          {
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0], // Slide up slightly on appear
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

export default KeyboardOverlay;
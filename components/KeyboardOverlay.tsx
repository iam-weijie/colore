import React, { useEffect, useState } from 'react';
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
}

const KeyboardOverlay: React.FC<KeyboardOverlayProps> = ({ children }) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardHeight(e.endCoordinates.height);
        
        // Delay the appearance to let keyboard slide in
        setTimeout(() => {
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
          setIsVisible(false);
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setKeyboardHeight(0);
        });
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [fadeAnim]);

  if (!isVisible || keyboardHeight === 0) return null;

  return (
    <Animated.View
      className="absolute left-0 right-0 bg-white shadow-md border-t border-neutral-200 z-50 rounded-t-[32px]"
      style={{
        bottom: keyboardHeight,
        paddingHorizontal: 16,
        paddingVertical: 12,
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
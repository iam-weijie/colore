import React, { useEffect, useState, useRef } from 'react';
import {
  Keyboard,
  KeyboardEvent,
  View,
  LayoutAnimation,
  Platform,
  Animated,
  Modal,
} from 'react-native';

interface KeyboardOverlayProps {
  children: React.ReactNode;
  offsetY?: number;
  onFocus?: boolean;
}

const KeyboardOverlay: React.FC<KeyboardOverlayProps> = ({ 
  children, 
  offsetY = 0, 
  onFocus = true 
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isVisible, setIsVisible] = useState(onFocus);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Configure layout animation before state updates
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        
        setKeyboardHeight(e.endCoordinates.height);
        setIsVisible(true);

        // Use requestAnimationFrame to ensure state updates are complete
        requestAnimationFrame(() => {
          timeoutRef.current = setTimeout(() => {
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }).start();
          }, Platform.OS === 'ios' ? 100 : 50);
        });
      }
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }).start(() => {
          // Use requestAnimationFrame to batch state updates
          requestAnimationFrame(() => {
            setIsVisible(false);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setKeyboardHeight(0);
          });
        });
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Remove fadeAnim from dependencies

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <Modal backdropColor={"#FF0000"} visible={isVisible} onDismiss={() => {setIsVisible(false)}} onRequestClose={() => {console.log("[KeyboardOverlay]: Pressed~")}}>
      <Animated.View
        className="absolute left-0 right-0 bg-white h-[70px] shadow-md z-50 rounded-t-[32px]"
        style={{
          bottom: keyboardHeight,
          paddingHorizontal: 12,
          paddingVertical: 8,
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            },
          ],
        }}
      >
        {children}
      </Animated.View>
    </Modal>
  );
};

export default KeyboardOverlay;
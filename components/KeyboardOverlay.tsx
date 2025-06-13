import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardEvent,
  Platform,
  Animated,
  Modal,
  View,
  TouchableWithoutFeedback,
  EmitterSubscription,
  Dimensions,
} from 'react-native';

interface KeyboardOverlayProps {
  children: React.ReactNode;
  offsetY?: number;
  onFocus?: boolean;
  keyboardAlreadyVisible?: boolean;
}

const KeyboardOverlay: React.FC<KeyboardOverlayProps> = ({
  children,
  offsetY = 0,
  onFocus = true,
  keyboardAlreadyVisible = false,
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isVisible, setIsVisible] = useState(onFocus);
  const [isKeyboardHeightSet, setIsKeyboardHeightSet] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get('window').height;

  // Function to get keyboard height when already visible
  const getExistingKeyboardHeight = (): Promise<number> => {
    return new Promise((resolve) => {
      let resolved = false;
      
      // Set up temporary listeners to catch the next keyboard event
      const showListener = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        (e: KeyboardEvent) => {
          if (!resolved) {
            resolved = true;
            showListener.remove();
            hideListener.remove();
            resolve(e.endCoordinates?.height || 0);
          }
        }
      );

      const hideListener = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        () => {
          if (!resolved) {
            resolved = true;
            showListener.remove();
            hideListener.remove();
            resolve(0);
          }
        }
      );

      // Trigger a keyboard event by dismissing and immediately focusing again
      // This is a workaround to get the current keyboard height
      setTimeout(() => {
        if (!resolved) {
          // If no keyboard event fired within 100ms, use fallback
          const fallbackHeight = Platform.OS === 'ios' ? 320 : 250;
          resolved = true;
          showListener.remove();
          hideListener.remove();
          resolve(fallbackHeight);
        }
      }, 100);

      // Try to trigger keyboard events by briefly dismissing
      Keyboard.dismiss();
      // Note: You might need to programmatically focus an input here
      // This depends on your specific use case
    });
  };

  useEffect(() => {
    if (keyboardAlreadyVisible && !isKeyboardHeightSet) {
      // Method 1: Try to detect keyboard height using screen dimensions
      const detectKeyboardHeight = () => {
        // On some devices, we can estimate keyboard height based on screen size changes
        // This is a more reliable fallback than hardcoded values
        const estimatedKeyboardHeight = Platform.select({
          ios: Math.min(screenHeight * 0.4, 320), // 40% of screen or 320px max
          android: Math.min(screenHeight * 0.35, 280), // 35% of screen or 280px max
          default: 250,
        });

        console.log('[KeyboardOverlay] Using estimated keyboard height:', estimatedKeyboardHeight);
        setKeyboardHeight(estimatedKeyboardHeight);
        setIsKeyboardHeightSet(true);
        setIsVisible(true);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      };

      // Method 2: Try to get actual keyboard height (more complex but accurate)
      getExistingKeyboardHeight().then((height) => {
        if (height > 0) {
          console.log('[KeyboardOverlay] Got actual keyboard height:', height);
          setKeyboardHeight(height);
        } else {
          // Fall back to estimation if we couldn't get actual height
          detectKeyboardHeight();
          return;
        }
        
        setIsKeyboardHeightSet(true);
        setIsVisible(true);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });

      return;
    }

    if (!keyboardAlreadyVisible) {
      let showSub: EmitterSubscription;
      let hideSub: EmitterSubscription;

      const handleKeyboardShow = (e: KeyboardEvent) => {
        const height = e.endCoordinates?.height || 0;
        console.log('[KeyboardOverlay] Keyboard show event, height:', height);
        setKeyboardHeight(height);
        setIsVisible(true);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      };

      const handleKeyboardHide = () => {
        console.log('[KeyboardOverlay] Keyboard hide event');
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setIsVisible(false);
          setKeyboardHeight(0);
          setIsKeyboardHeightSet(false);
        });
      };

      showSub = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        handleKeyboardShow
      );
      hideSub = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        handleKeyboardHide
      );

      return () => {
        showSub?.remove();
        hideSub?.remove();
      };
    }
  }, [keyboardAlreadyVisible, isKeyboardHeightSet, screenHeight]);

  if (!isVisible) return null;

  console.log("Keyboard Height:", keyboardHeight);

  // ✅ NON-MODAL return (for keyboardAlreadyVisible)
  if (keyboardAlreadyVisible) {
    return (
      <Animated.View
        className="absolute self-center h-[70px] w-full py-2 bg-white rounded-t-[32px] shadow-md z-50"
        style={{
          bottom: -1 * keyboardHeight - 20,
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [75, 0],
              }),
            },
          ],
        }}
      >
        {children}
      </Animated.View>
    );
  }

  // ✅ MODAL return (default)
  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={Keyboard.dismiss}
      onDismiss={Keyboard.dismiss}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="absolute" />
      </TouchableWithoutFeedback>

        <Animated.View
          className="absolute left-0 right-0 h-[70px] w-full py-2 bg-white rounded-t-[32px] shadow-md z-50"
          style={{
            bottom: keyboardHeight,
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [75, 0],
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
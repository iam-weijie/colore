import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardEvent,
  Platform,
  Animated,
  Modal,
  StyleSheet,
  View,
  EmitterSubscription,
} from 'react-native';

interface KeyboardOverlayProps {
  children: React.ReactNode;
  offsetY?: number;
  onFocus?: boolean;
}

const KeyboardOverlay: React.FC<KeyboardOverlayProps> = ({
  children,
  offsetY = 0,
  onFocus = true,
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isVisible, setIsVisible] = useState(onFocus);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let showSub: EmitterSubscription;
    let hideSub: EmitterSubscription;

    const handleKeyboardShow = (e: KeyboardEvent) => {
      const height = e.endCoordinates?.height || 0;
      setKeyboardHeight(height);
      setIsVisible(true);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    };

    const handleKeyboardHide = () => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setIsVisible(false);
        setKeyboardHeight(0);
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
  }, []);

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={() => setIsVisible(false)}
    >
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            styles.overlay,
            {
              bottom: keyboardHeight,
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    height: 70,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
});

export default KeyboardOverlay;

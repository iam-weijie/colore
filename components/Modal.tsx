import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  Dimensions,
  Modal,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  Platform,
  View,
  Text,
} from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { useBackgroundColor, useTextColor, useThemeColors } from "@/hooks/useTheme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ModalSheetProps {
  children: React.ReactNode;
  title?: string;
  isVisible: boolean;
  onClose: () => void;
}

const ModalSheet: React.FC<ModalSheetProps> = ({
  children,
  title,
  isVisible,
  onClose,
}) => {
  const [visible, setVisible] = useState(isVisible);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const screenHeight = Dimensions.get("window").height;
  const backgroundColor = useBackgroundColor();
  const textColor = useTextColor()

  // Animation values
  const translateY = useSharedValue(screenHeight);
  const overlayOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  // Fullscreen is driven by keyboard visibility
  const isFull = keyboardVisible;

  // Keyboard listeners
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Gesture handler (disabled in fullscreen)
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      if (!isFull && event.translationY > 0) {
        translateY.value = context.value.y + event.translationY;
        overlayOpacity.value = interpolate(
          translateY.value,
          [0, screenHeight * 0.5],
          [0.2, 0.05],
          Extrapolation.CLAMP
        );
      }
    })
    .onEnd((event) => {
      if (!isFull && event.translationY > screenHeight * 0.2) {
        translateY.value = withSpring(screenHeight, { damping: 20, stiffness: 90 });
        overlayOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(setVisible)(false);
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
        overlayOpacity.value = withTiming(isFull ? 0 : 0.2, { duration: 200 });
      }
    });

  const animatedOverlay = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Open/close animations
  useEffect(() => {
    if (isVisible) {
      setVisible(true);
      requestAnimationFrame(() => {
        translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
        overlayOpacity.value = withTiming(isFull ? 0 : 0.2, { duration: 300 });
      });
    } else {
      handleClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // If keyboard visibility changes while open, adjust overlay immediately
  useEffect(() => {
    if (!visible) return;
    overlayOpacity.value = withTiming(isFull ? 0 : 0.2, { duration: 150 });
  }, [isFull, visible, overlayOpacity]);

  const handleClose = useCallback(() => {
    translateY.value = withSpring(screenHeight, { damping: 20, stiffness: 90 });
    overlayOpacity.value = withTiming(0, { duration: 300 });
    setTimeout(() => {
      setVisible(false);
      onClose();
    }, 300);
  }, [screenHeight, onClose, translateY, overlayOpacity]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        
      };
    }, [visible, handleClose])
  );

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={handleClose}
      animationType="none"
      statusBarTranslucent
    >
      <GestureHandlerRootView 
      className="flex-1">

          {/* Overlay only in sheet mode */}
          {!isFull && (
            <AnimatedPressable
              style={[{ flex: 1 }, animatedOverlay]}
              onPress={() => {
                handleClose();
                Keyboard.dismiss();
              }}
            >
              <View className="flex-1 bg-black" />
            </AnimatedPressable>
          )}

          {/* Sheet / Fullscreen container */}
          <Animated.View
            style={[animatedStyle, { backgroundColor: backgroundColor }]}
            className={
              isFull
                ? "absolute top-0 left-0 right-0 bottom-0 py-4"
                : "absolute bottom-5 w-[92%] max-h-[75%] left-[4%] pb-2 rounded-[48px] shadow-xl elevation-10 overflow-hidden"
            }
          >
            {/* Drag handle (only sheet mode) */}
            {!isFull && (
              <GestureDetector gesture={panGesture}>
                <View className="w-full items-center pt-4 px-6">
                  <View className="w-12 h-1 bg-gray-300 rounded-full" />
                </View>
              </GestureDetector>
            )}

            {/* Title */}
            {title && (
              <View className="w-full items-center justify-center my-2 px-6">
                <Text 
                className="text-[16px] font-JakartaSemiBold"
                style={{
                  color: textColor
                }}>{title}</Text>
              </View>
            )}

            {/* Content */}
            <View className="flex-1">{children}</View>
          </Animated.View>

      </GestureHandlerRootView>
    </Modal>
  );
};

export default ModalSheet;

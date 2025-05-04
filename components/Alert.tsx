import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertProps } from '@/types/type';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useHaptics } from "@/hooks/useHaptics";
import { useFocusEffect } from '@react-navigation/native';

const AlertNotification: React.FC<AlertProps> = ({
  title,
  message,
  type,
  status,
  duration,
  onClose,
  action,
  actionText,
  color,
}) => {
  const [visible, setVisible] = useState<boolean>(true);
  const [onAnimationFinish, setOnAnimationFinish] = useState(false);
  const SWIPE_THRESHOLD = -15; // How far user needs to swipe up to dismiss

  const { triggerHaptic } = useHaptics();

  // Animation values
  const translateY = useSharedValue(-200);
  const modalOpacity = useSharedValue(0);
  const loadingBarWidth = useSharedValue(0);

  useEffect(() => {
    // Spring animation to slide in
    translateY.value = withSpring(0, { damping: 25, stiffness: 75, mass: 0.75 });

    // Animate progress bar
    loadingBarWidth.value = withTiming(100, {
      duration: duration ?? (status === 'error' ? 200 : 400),
    });

    const timeout = setTimeout(() => {
      if (visible) {
        translateY.value = withSpring(-200, { damping: 25, stiffness: 75, mass: 0.75 });
        setOnAnimationFinish(true);
      }
    }, duration ?? (status === 'error' ? 200 : 400));

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (onAnimationFinish) {
      setTimeout(() => {
        if (status == 'success') {
          triggerHaptic(Haptics.NotificationFeedbackType.Success);
        } else if (status == 'error') {
          triggerHaptic(Haptics.NotificationFeedbackType.Error);
        }
        setVisible(false);
        if (onClose) onClose();
      }, duration ?? (status === 'error' ? 200 : 400));
    }
  }, [onAnimationFinish]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setVisible(false);
      };
    }, [])
  );

  const handlePanGesture = (event: PanGestureHandlerGestureEvent) => {
    const { translationY } = event.nativeEvent;
    
    // Only allow swipe up to dismiss
    if (translationY < 0) {
      translateY.value = translationY;
      
      if (event.nativeEvent.state === 4) { // 5 is END state
        if (translationY < SWIPE_THRESHOLD) {
          // Swiped up enough - dismiss
          translateY.value = withSpring(-200, { damping: 25, stiffness: 75, mass: 0.75 });
          setOnAnimationFinish(true)
        } else {
          // Return to original position
          translateY.value = translationY;
        }
      }
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const animatedLoadingStyle = useAnimatedStyle(() => {
    return {
      width: `${loadingBarWidth.value}%`,
    };
  });

  const animatedOpacity = useAnimatedStyle(() => {
    return {
      opacity: modalOpacity.value,
    };
  });

  if (!visible) return null;

  return (
    <GestureHandlerRootView className="absolute flex-1 top-0 w-full shadow-lg">
      <PanGestureHandler onGestureEvent={handlePanGesture}>
        <Animated.View
          style={[
            animatedStyle,
            {
              backgroundColor: color
                ? color
                : type === 'ERROR'
                ? '#FAFAFA'
                : type === 'POST'
                ? '#93c5fd'
                : type === 'UPDATE'
                ? '#FBB1F5'
                : type === 'DELETE'
                ? '#ffe640'
                : '#CFB1FB',
              opacity: 1,
            },
          ]}
          className="
            top-2
            w-[92%]
            mx-auto
            pt-8
            pb-4
            px-8
            bg-[#FAFAFA]
            rounded-[44px]
            min-h-[18%]
            shadow-lg
            overflow-hidden"
        >
          <View className="flex-1 flex flex-col justify-around">
            <View className="flex-row items-center">
              <View>
                <Text className="text-md text-[#FAFAFA] font-JakartaBold">Colore</Text>
                <Text className="text-2xl font-JakartaBold">{title}</Text>
                <Text className="text-md text-black font-Jakarta-Medium">
                  {message}
                </Text>
              </View>
            </View>

            {!actionText ? (
              <View className="w-full mx-auto my-2 h-2 bg-[#FAFAFA] rounded-[48px] overflow-hidden">
                <Animated.View
                  style={[animatedLoadingStyle]}
                  className="h-full rounded-[48px] bg-black"
                />
              </View>
            ) : (
              <View className="flex-row items-center justify-between my-4">
                <TouchableOpacity
                  onPress={onClose}
                  className="p-4 bg-[#FAFAFA] mx-2 rounded-[20px] flex-1"
                >
                  <Text className="text-black text-center text-md font-Jakarta-Medium">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={action}
                  className="p-4 bg-[#000000] mx-2 rounded-[20px] flex-1"
                >
                  <Text className="text-white text-center text-md font-Jakarta-Medium">
                    {actionText}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

export default AlertNotification;
import React, { useEffect, useRef } from "react";
import {
  Keyboard,
  Text,
  View,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Animated,
  Easing
} from "react-native";
import CustomButton from "./CustomButton";

interface CarouselPageProps {
  label: string;
  caption: string;
  color: string;
  onSubmit: () => void;
  children: React.ReactNode;
  progress: number;
  total: number;
  disabled: boolean;
}

const CarouselPage: React.FC<CarouselPageProps> = ({
  label,
  caption,
  color,
  onSubmit,
  children,
  progress,
  total,
  disabled
}) => {
  const progressPercent = (progress / total) * 100;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const isInitialRender = useRef(true);

  // Animation trigger on mount and progress change
  useEffect(() => {
    // Skip the reset on initial render
    if (!isInitialRender.current) {
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    isInitialRender.current = false;
  }, [progress]);

  // Progress bar width animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

  return (
    <TouchableWithoutFeedback 
      className="flex-1" 
      onPress={() => Keyboard.dismiss()}
    >
      <Animated.View 
        className="flex-1 px-6 py-6"
        style={{
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        }}
      >
        {/* Animated Progress Bar */}
        <View className="h-2 rounded-full bg-[#FAFAFA] mb-4 overflow-hidden">
          <Animated.View
            style={{ 
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              }), 
              backgroundColor: color,
            }}
            className="h-2 rounded-full"
          />
        </View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }}
        >
          <Text className="text-[20px] font-JakartaBold mb-1">{label}</Text>
          <Text className="text-tray-700 mb-6 text-[16px] font-Jakarta">
            {caption}
          </Text>
        </Animated.View>

        <Animated.View 
          className="flex-1"
          style={{
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }}
        >
          {children}
        </Animated.View>
     
        <KeyboardAvoidingView className="" behavior="padding">
          <Animated.View 
            className="flex-1 items-center justify-end h-full"
            style={{
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            }}
          >
            <CustomButton
              className="w-[50%] h-14 rounded-full shadow-none bg-black"
              fontSize="lg"
              title={progressPercent < 100 ? "continue" : "submit"}
              padding="0"
              onPress={onSubmit}
              disabled={disabled}
            />
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default CarouselPage;
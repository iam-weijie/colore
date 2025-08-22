import React, { useEffect, useRef } from "react";
import {
  Keyboard,
  Text,
  View,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Animated,
  Easing,
  TouchableOpacity,
  Platform
} from "react-native";
import CustomButton from "./CustomButton";
import { Ionicons } from "@expo/vector-icons";

interface CarouselPageProps {
  label: string;
  caption: string;
  color: string;
  onSubmit: () => void;
  onBack?: () => void;
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
  onBack,
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
      <View className="flex-1 bg-white">
        {/* Header with progress indicator and back button */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            {/* Back button - only show if not on first step and onBack provided */}
            {onBack && progress > 1 && (
              <TouchableOpacity 
                onPress={onBack}
                className="p-2 rounded-full bg-gray-100"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={20} color="#4B5563" />
              </TouchableOpacity>
            )}
            
            {/* Progress info - centered */}
            <View className="flex-1 items-center">
              <Text className="text-sm font-JakartaSemiBold text-gray-500">
                Step {progress} of {total}
              </Text>
            </View>
            
            {/* Empty view to balance the layout */}
            {onBack && progress > 1 ? (
              <View className="w-10" /> // Invisible spacer to balance the back button
            ) : null}
          </View>
          
          {/* Animated Progress Bar - Removed the ruler styling */}
          <View className="h-2 rounded-full bg-gray-100 overflow-hidden">
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
        </View>

        <Animated.View 
          className="flex-1"
          style={{
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }}
        >
          {/* Content - Centered */}
          <View className="mb-6  px-6">
            <Text className="text-2xl font-JakartaBold mb-2 text-gray-900 text-center">
              {label}
            </Text>
            <Text className="text-base text-gray-600 font-Jakarta leading-6 text-center">
              {caption}
            </Text>
            
          </View>
                    {/* Main content area - Centered with horizontal padding */}
                    <View className="flex-1 w-full mb-6 justify-center px-6">
            {children}
          </View>

        </Animated.View>
     
        {/* Footer with centered button - KeyboardAvoidingView with proper spacing */}
        <KeyboardAvoidingView 
          className="px-6 pb-6 pt-4 bg-white "
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <Animated.View 
            className="items-center"
            style={{
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            }}
          >
            <CustomButton
              title={progress < total ? "Continue" : "Get Started"}
              padding={4}
              onPress={onSubmit}
              disabled={disabled}
              backgroundColor={color}
              className="rounded-xl w-full max-w-md" // Centered with max width
            />
            
            {/* Optional: Skip button for intermediate steps */}
            {progress < total && (
              <TouchableOpacity onPress={onSubmit} className="mt-4">
                <Text className="text-center text-gray-500 font-Jakarta">
                  Skip for now
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default CarouselPage;
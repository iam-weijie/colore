
import * as React from "react";
import { useEffect, useState, useCallback } from "react";

import { router, useFocusEffect } from "expo-router";
import { Dimensions, 
  Image, 
  Modal, 
  ImageSourcePropType,
  Keyboard,
  KeyboardAvoidingView, 
  Pressable,  
  SafeAreaView, 
  TouchableOpacity, 
  View, 
  Text, 
  } from "react-native";
import Animated, { useSharedValue, withSpring, useAnimatedStyle, BounceIn, FadeIn, FadeOut, withTiming, runOnJS } from "react-native-reanimated";
import { GestureDetector, GestureHandlerRootView, Gesture } from 'react-native-gesture-handler';

const ModalSheet = ({ children, title, isVisible, onClose }) => {
    const [visible, setVisible] = useState(isVisible);
    const screenHeight = Dimensions.get('window').height;
  
    // Animation values
    const translateY = useSharedValue(screenHeight);
    const modalOpacity = useSharedValue(0);
    const startY = useSharedValue(0);

    // Gesture handler for drag to close
    const panGesture = Gesture.Pan()
        .onBegin(() => {
            startY.value = translateY.value;
        })
        .onUpdate((e) => {
            // Only allow dragging downward
            if (e.translationY > 0) {
                translateY.value = startY.value + e.translationY;
            }
        })
        .onEnd((e) => {
            // If dragged more than 20% of screen height, close modal
            if (e.translationY > screenHeight * 0.2) {
                translateY.value = withSpring(screenHeight, {
                    damping: 25,
                    stiffness: 90,
                    mass: 1,
                });
                modalOpacity.value = withTiming(0, { duration: 200 });
                runOnJS(setVisible)(false);
                runOnJS(onClose)();
            } else {
                // Return to original position
                translateY.value = withSpring(0, {
                    damping: 25,
                    stiffness: 90,
                    mass: 1,
                });
            }
        });

    const animatedOpacity = useAnimatedStyle(() => ({
        opacity: modalOpacity.value
    }));

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    useEffect(() => {
        if (isVisible) {
            setVisible(true);
            translateY.value = withSpring(0, {  
                damping: 25,
                stiffness: 90,
                mass: 1,
            });
            modalOpacity.value = withTiming(0.2, { duration: 200 });
        }
    }, [isVisible]);

    const handleClose = () => {
        translateY.value = withSpring(screenHeight, { 
            damping: 25,
            stiffness: 90,
            mass: 1,
        });
        modalOpacity.value = withTiming(0, { duration: 200 });
        setTimeout(() => {
            setVisible(false);
            onClose();
        }, 200);
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} onRequestClose={handleClose}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardAvoidingView behavior={'height'} style={{ flex: 1 }}>
                    <Pressable 
                        className="flex-1" 
                        onPress={() => {
                            handleClose();
                            Keyboard.dismiss();
                        }}
                    >
                        <Animated.View
                            style={[animatedOpacity, {backgroundColor: "black"}]}
                            className="flex-1 absolute top-0 left-0 right-0 bottom-0"
                        />
                    </Pressable>
                    
                    <GestureDetector gesture={panGesture}>
                        <Animated.View
                            style={animatedStyle}
                            className="absolute w-[92%] max-h-[80%] left-[50%] -ml-[46%] p-6 bg-[#FAFAFA] rounded-[48px] shadow-xs bottom-5 overflow-hidden"
                        >
                            {/* Drag indicator */}
                            <View className="w-full items-center pb-2">
                                <View className="w-12 h-1 bg-gray-300 rounded-full" />
                            </View>
                            
                            <View className="w-full flex items-center justify-center mb-2">
                                <Text className="text-[16px] font-JakartaBold">
                                    {title}
                                </Text>
                            </View>
                            {children}
                        </Animated.View>
                    </GestureDetector>
                </KeyboardAvoidingView>
            </GestureHandlerRootView>
        </Modal>
    );
};
export default ModalSheet
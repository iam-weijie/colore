
import * as React from "react";
import { useEffect, useState, useCallback } from "react";

import { router, useFocusEffect } from "expo-router";
import { Dimensions, Image, Modal, ImageSourcePropType, Pressable,  SafeAreaView, TouchableOpacity, View, Text } from "react-native";
import Animated, { useSharedValue, withSpring, useAnimatedStyle, BounceIn, FadeIn, FadeOut, withTiming } from "react-native-reanimated";



const ModalSheet = ({ children, isVisible, onClose }: {children: any, isVisible: boolean, onClose: () => void}) => {
    console.log("isVisible", isVisible)
    const [visible, setVisible] = useState(isVisible);
  
    const translateY = useSharedValue(500); 
    const modalOpacity = useSharedValue(0);
  
    const animatedOpacity = useAnimatedStyle(() => {
          return {
            opacity: modalOpacity.value
          } 
        })
  
    const animatedStyle = useAnimatedStyle(() => {
            return {
              transform: [{ translateY: translateY.value }],
            };
            
          });
  
          useEffect(() => {
         // Spring animation to slide in
            translateY.value = withSpring(0, {  
              damping: 18,
              stiffness: 125,
              mass: 1,});  // Slide in to 0 with spring effect
        }, [visible, children]);  // Dependency array ensures useEffect runs when either action or friendName changes
  
      useEffect(() => {
    if (!visible) {
      modalOpacity.value = withTiming(0, {
        duration: 200
      })
    } else {
      modalOpacity.value = withTiming(0.2, {
        duration: 200
      })
    }
      }, [visible])
  
      
    const handleClose = () => {
      translateY.value = withSpring(500, { 
        damping: 18,
        stiffness: 125,
        mass: 1, });  // Slide out to off-screen
      modalOpacity.value = withTiming(0, {
        duration: 200
      })
      setTimeout(() => {
      setVisible(false);
      onClose();
      }
      , 500);
      
    };
  
    useFocusEffect(
      useCallback(() => {
        return () => {
          handleClose() // Set visible to false when navigating away
        };
      }, [])
    );
    console.log("children", children, typeof children)
    return (
      <Modal transparent visible={visible} onRequestClose={handleClose}>
         <Pressable className="flex-1 " onPress={handleClose}>
                   <Animated.View
                              style={[animatedOpacity, {backgroundColor: "black"}]}
                              className="flex-1 absolute top-0 left-0 right-0 bottom-0"
                            />
          </Pressable>
          <Animated.View
               style={[
                 animatedStyle,]}
               className="
               absolute 
               w-[92%]
               min-h-[55%]
               max-h-[65%]
               left-[50%]
               -ml-[46%]
               p-6
               bg-[#FAFAFA]
               rounded-[48px] 
               shadow-xs
               bottom-5  
               overflow-hidden"
             >
          {children}
        </Animated.View>
      </Modal>
      
    );
  }

export default ModalSheet
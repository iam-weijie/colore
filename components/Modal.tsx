
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
import Animated, { useSharedValue, withSpring, useAnimatedStyle, BounceIn, FadeIn, FadeOut, withTiming } from "react-native-reanimated";


const screenHeight = Dimensions.get('screen').height

const ModalSheet = ({ children, title, isVisible, onClose }: {children: any, title: string, isVisible: boolean, onClose: () => void}) => {
   
    const [visible, setVisible] = useState(isVisible);
  
    const translateY = useSharedValue(screenHeight); 
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
              damping: 25,
              stiffness: 90,
              mass: 1,});  // Slide in to 0 with spring effect
        }, [visible, children]);  
  
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
      translateY.value = withSpring(screenHeight, { 
        damping: 25,
        stiffness: 90,
        mass: 1, });  // Slide out to off-screen
      modalOpacity.value = withTiming(0, {
        duration: 200
      })
      setTimeout(() => {
      setVisible(false);
      onClose();
      }
      , 200);
      
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
          <KeyboardAvoidingView 
            behavior={'height'}
            style={{ flex: 1 }}
  >
         <Pressable className="flex-1 " onPress={() => 
          {
            handleClose()
            Keyboard.dismiss()
          }
          }>
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
               
               max-h-[80%]
               left-[50%]
               -ml-[46%]
               p-6
               bg-[#FAFAFA]
               rounded-[48px] 
               shadow-xs
               bottom-5  
               overflow-hidden"
             >
              <View className="w-full flex items-center justify-center mb-2">
                <Text className="text-[16px] font-JakartaBold">
                  {title}
                </Text>
              </View>
          {children}
        </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
      
    );
  }

export default ModalSheet
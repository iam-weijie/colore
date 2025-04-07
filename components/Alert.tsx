import React, { useState, useEffect, useRef, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {Image, Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import Animated, { useSharedValue, withSpring, useAnimatedStyle, BounceIn, FadeIn, FadeOut, withTiming } from "react-native-reanimated";
import { AlertProps } from "@/types/type";
import * as Haptics from 'expo-haptics';
import { icons } from "@/constants";


const AlertNotification: React.FC<AlertProps> = ({ title, message, type, status, duration, onClose, action, actionText }) => {

  const [visible, setVisible] = useState<boolean>(true)
  const [onAnimationFinish, setOnAnimationFinish] = useState(false)

  // Initialize shared value for the Y translation
  const translateY = useSharedValue(-200);  // Start off-screen
  const modalOpacity = useSharedValue(0);
  const loadingBarWidth = useSharedValue(0);

  useEffect(() => {
    // Spring animation to slide in
    translateY.value = withSpring(0, { damping: 25, stiffness: 75, mass: 0.75 });

     // Animate progress bar
    loadingBarWidth.value = withTiming(100, {
    duration: duration ?? 1200
  });

    const timeout = setTimeout(() => {
      translateY.value = withSpring(-200, { damping: 25, stiffness: 75, mass: 0.75 }); // Slide out // Tell context to remove it
      setOnAnimationFinish(true);
    }, duration ?? 1200);
  
    return () => clearTimeout(timeout);
  }, []);
   // Dependency array ensures useEffect runs when either action or friendName changes

  useEffect(() => {
if (onAnimationFinish) {
      setTimeout(() => {
        console.log("Animation completed");
        if (status == 'success') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (status == 'error') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        else {}
        setVisible(false);
        if (onClose) onClose(); // Hide the modal after the animation completes
      }
      , 500); // Match this duration with the animation duration
    }
}, [onAnimationFinish]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setVisible(false); // Set visible to false when navigating away
      };
    }, [])
  );
    // Create animated style using the shared value
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
        opacity: modalOpacity.value
      } 
    })

    const handleClose = () => {
      setVisible(false)
      
    }

  return (

     
    <View
     className="absolute flex-1 top-0 w-full shadow-lg"
      //entering={FadeIn}
    >
      <Animated.View
       style={[
        animatedStyle, {
          backgroundColor: type === "ERROR" ? "#FAFAFA"
           : (type === "POST" ? "#93c5fd" 
            : (type === "UPDATE" ? "#fbb1d6" 
              : (type === "DELETE") ? "#ffe640" : "#CFB1FB" ) ),
          opacity: 1,
       }]}
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
       overflow-hidden">
        <View 
        className="  
        flex-1 
        flex 
       flex-col 
       justify-around ">
        <View className="flex-row items-center">
          <View>
          <Text className="text-md text-[#FAFAFA] font-JakartaBold">Colore</Text>
          <Text className="text-2xl font-JakartaBold">{title}</Text>
          <Text className="text-md text-black font-Jakarta-Medium">{message}</Text>
          </View>
          {/*<View className=" p-2 bg-white rounded-full">
             <Image
            source={
              type === "ERROR" ? icons.close
           : (type === "POST" ? icons.send
            : (type === "UPDATE" ? icons.refresh
              : (type === "DELETE") ? icons.trash : icons.settings )
            )
            }
            tintColor={
              type === "ERROR" ? "#FAFAFA"
           : (type === "POST" ? "#93c5fd" 
            : (type === "UPDATE" ? "#fbb1d6" 
              : (type === "DELETE") ? "#ffe640" : "#CFB1FB" ) )
            }
            className="w-7 h-7"
          />
          </View>*/}
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
            <Text className="text-black text-center text-md font-Jakarta-Medium">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={action}
            className="p-4 bg-[#000000] mx-2  rounded-[20px] flex-1"
          >
            <Text className="text-white text-center text-md font-Jakarta-Medium">{actionText}</Text>
          </TouchableOpacity>
            </View>
        )}
        </View>
      
      
      </Animated.View>
    </View>
  );
};

export default AlertNotification;



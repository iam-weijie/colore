import React from "react";
import {
  Image,
  ImageSourcePropType,
  Text,
  View,
} from "react-native";
import { icons, temporaryColors } from "@/constants";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS
} from "react-native-reanimated";
import { TapGestureHandler, GestureHandlerRootView } from "react-native-gesture-handler";

const AnimatedTouchable = Animated.createAnimatedComponent(View);

const ItemContainer = ({label, caption, icon, colors, iconColor, actionIcon, onPress}: 
  {label: string, caption?: string, icon: ImageSourcePropType, colors:[string, string, ...string[]], iconColor: string, actionIcon?: ImageSourcePropType,  onPress: () => void}) => {
    
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
      };
    });
    
    const handlePressIn = () => {
      scale.value = withSpring(0.96, {
        damping: 10,
        stiffness: 200,
      });
      opacity.value = withTiming(0.8, { duration: 100 });
    };
    
    const handlePressOut = () => {
      scale.value = withSpring(1, {
        damping: 10,
        stiffness: 200,
      });
      opacity.value = withTiming(1, { duration: 100 });
    };
    
    const handlePress = () => {
      scale.value = withSpring(1, {
        damping: 5,
        stiffness: 300,
      }, () => {
        runOnJS(onPress)();
      });
    };

    return (
      <GestureHandlerRootView>
        <TapGestureHandler
          onBegan={handlePressIn}
          onEnded={handlePressOut}
          onActivated={handlePress}
        >
          <AnimatedTouchable
            className="relative flex mb-3 py-4 pl-3 pr-7 rounded-[24px] w-full"
            style={[
              animatedStyle,
              { 
                backgroundColor: "#FAFAFA"
              }
            ]}
          >
            <View className="flex-1 flex flex-row items-center justify-between w-full">
              <View className="flex-row items-center justify-start">
                <LinearGradient
                  colors={colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-[16px] p-[4px] mx-3"
                >
                  <View className="flex-row items-center rounded-[14px] p-2">
                    <Image
                      source={icon}
                      className="w-5 h-5"
                      style={{ tintColor: "#FAFAFA" }}
                    />
                  </View>
                </LinearGradient>
                <View className="flex flex-col items-start max-w-[70%]">
                  <Text className="text-[14px] font-bold text-[#000]">
                    {label}
                  </Text>
                  {caption && (
                    <Text className="text-[12px] text-gray-400">
                      {caption}
                    </Text>
                  )}
                </View>
              </View>
              {actionIcon && (
                <Image
                  source={actionIcon}
                  className="w-5 h-5"
                  style={{ tintColor: iconColor }}
                />
              )}
            </View>
          </AnimatedTouchable>
        </TapGestureHandler>
      </GestureHandlerRootView>
    );
}

export default ItemContainer;
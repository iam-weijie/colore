import { icons } from "@/constants";
import { isOnlyEmoji } from "@/lib/post";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Image,
  Text,
  TouchableOpacity,
  View,
  Easing,
  Dimensions
} from "react-native";
import PinIcon from "./PinComponent";
import CustomButton from "./CustomButton";

const { width, height } = Dimensions.get('window');

type Stacks = {
  name: string;
  ids: number[];
  elements: any[];
  center: { x: number; y: number };
};

const StackCircle = ({
  stack,
  isEditable = false,
  scrollOffset = { x: 0, y: 0 },
  onViewPress,
  onEditPress,
  onSendPress,
  enabledPan,
  stackMoving,
  updateStackPosition,
}: {
  stack: Stacks;
  isEditable?: boolean;
  scrollOffset?: { x: 0, y: 0 };
  onViewPress: () => void;
  onEditPress: () => void;
  onSendPress: () => void;
  enabledPan: () => void;
  stackMoving: () => void;
  updateStackPosition: (x: number, y: number, stack: Stacks) => void;
}) => {
  const SHOW_BUTTONS_THRESHOLD = 120;

  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const defaultCenter = { x: width / 2, y: height / 2 };
  
  const safeCenter = stack?.center || defaultCenter;
  const basePosition = useRef({
    x: safeCenter.x,
    y: safeCenter.y,
  }).current;

  const dragOffset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(0)).current;

  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isReadyToDrag = useRef(false);

  // Safely get animated value
  const getAnimatedValue = (animatedValue: Animated.ValueXY) => {
    return {
      x: animatedValue.x.__getValue ? animatedValue.x.__getValue() : 0,
      y: animatedValue.y.__getValue ? animatedValue.y.__getValue() : 0
    };
  };

  // Animate on mount
  useEffect(() => {
    // Start glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Start subtle pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: isFocused ? 1.15 : 1,
      friction: 7,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [isFocused]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragOffset.setValue({ x: 0, y: 0 });

        if (isEditable) {
          enabledPan();
          stackMoving();
          longPressTimeout.current = setTimeout(() => {
            setIsDragging(true);
            isReadyToDrag.current = true;
            Animated.spring(scaleValue, { 
              toValue: 1.25, 
              useNativeDriver: true 
            }).start();
          }, 300);
        }
      },
      onPanResponderMove: (_, gesture) => {
        if (isReadyToDrag.current) {
          dragOffset.setValue({ x: gesture.dx, y: gesture.dy });
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (longPressTimeout.current) {
          clearTimeout(longPressTimeout.current);
          longPressTimeout.current = null;
        }

        if (isReadyToDrag.current) {
          const offset = getAnimatedValue(dragOffset);
          const newX = basePosition.x + offset.x;
          const newY = basePosition.y + offset.y;
          basePosition.x = newX;
          basePosition.y = newY;
          updateStackPosition(newX, newY, stack);
        }

        Animated.spring(scaleValue, { 
          toValue: isFocused ? 1.15 : 1, 
          useNativeDriver: true 
        }).start();
        setIsDragging(false);
        isReadyToDrag.current = false;
        stackMoving();
      },
      onPanResponderTerminate: () => {
        if (longPressTimeout.current) {
          clearTimeout(longPressTimeout.current);
          longPressTimeout.current = null;
        }
        setIsDragging(false);
        isReadyToDrag.current = false;
      }
    })
  ).current;

  useEffect(() => {
    if (!isDragging) {
      if (stack?.center && stack.center.x !== undefined && stack.center.y !== undefined) {
        basePosition.x = stack.center.x;
        basePosition.y = stack.center.y;
      }
      dragOffset.setValue({ x: 0, y: 0 });
    }
  }, [stack?.center?.x, stack?.center?.y]);

  useEffect(() => {
    if (!stack?.center) return;
    
    const dx = Math.abs((scrollOffset?.x || 0) + 180 - stack.center.x);
    const dy = Math.abs((scrollOffset?.y || 0) + 420 - stack.center.y);
    const distance = Math.sqrt(dx * dx + dy * dy);
    setIsFocused(distance <= SHOW_BUTTONS_THRESHOLD && isEditable);
  }, [scrollOffset?.x, scrollOffset?.y, isEditable, stack?.center]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      className="absolute items-center justify-center"
      style={{
        top: basePosition.y - 140,
        left: basePosition.x - 140,
        width: 280,
        height: 280,
        transform: [
          { translateX: dragOffset.x },
          { translateY: dragOffset.y },
          { scale: scaleValue },
        ],
        zIndex: isFocused ? 999 : 1,
      }}
    >
      {/* Multi-layered Glow effect */}
      <Animated.View 
        className="absolute w-60 h-60 rounded-[40px]"
        style={{
          backgroundColor: glowAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(207, 177, 251, 0.15)', 'rgba(147, 197, 253, 0.3)']
          }),
          transform: [{ scale: glowAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.25]
          }) }]
        }}
      />
      
      <Animated.View 
        className="absolute w-52 h-52 rounded-[36px]"
        style={{
          backgroundColor: glowAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(255, 200, 251, 0.1)', 'rgba(254, 240, 138, 0.2)']
          }),
          transform: [{ scale: glowAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.15]
          }) }]
        }}
      />

      {/* Central content area - larger and more rounded */}
      <Animated.View
        className="w-48 h-48 bg-white/95 items-center justify-center"
        style={{
          borderRadius: 36,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          transform: [
            { 
              scale: scaleValue.__getValue 
                ? scaleValue.interpolate({
                    inputRange: [1, 1.15, 1.25],
                    outputRange: [1, 1.08, 1.15]
                  })
                : 1
            }
          ]
        }}
      >
        {/* Stack Name */}
        <Text
          className="text-black font-JakartaBold text-center px-4"
          numberOfLines={2}
          ellipsizeMode="tail"
          style={{ fontSize: isOnlyEmoji(stack?.name || "") ? 36 : 20 }}
        >
          {stack?.name || "Untitled"}
        </Text>

        {/* Post Count - integrated into the design */}
        <View className="absolute -bottom-5 bg-indigo-500 px-5 py-2 rounded-full shadow-lg">
          <Text className="text-white font-bold text-sm">
            {stack?.ids?.length || 0} posts
          </Text>
        </View>
      </Animated.View>

      {/* New View Button Design */}
      <Animated.View 
        className="absolute -bottom-16 w-full items-center justify-center"
        style={{
          opacity: scaleValue.interpolate({
            inputRange: [1, 1.15],
            outputRange: [0.9, 1]
          }),
          transform: [
            {
              scale: scaleValue.interpolate({
                inputRange: [1, 1.15],
                outputRange: [0.95, 1.05]
              })
            },
            {
              translateY: pulseAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -3]
              })
            }
          ]
        }}
      >
        <TouchableOpacity
          onPress={onViewPress}
          className="px-6 py-4 rounded-2xl flex-row items-center justify-center"
          style={{
            backgroundColor: '#CFB1FB',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Text className="text-white font-bold text-base mr-2">
            Explore Stack
          </Text>
          <Image 
            source={icons.arrowRight} 
            className="w-5 h-5" 
            tintColor="white" 
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Floating action buttons */}
      {isEditable && isFocused && (
        <>
          <Animated.View 
            style={{
              opacity: scaleValue.interpolate({
                inputRange: [1, 1.15],
                outputRange: [0, 1]
              }),
              transform: [
                { 
                  scale: scaleValue.interpolate({
                    inputRange: [1, 1.15],
                    outputRange: [0.8, 1]
                  }) 
                }
              ]
            }}
          >
            <TouchableOpacity
              onPress={onEditPress}
              className="absolute -right-10 -top-10 w-16 h-16 bg-white rounded-full items-center justify-center shadow-lg"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.2,
                shadowRadius: 5,
                borderWidth: 2,
                borderColor: '#f0f0f0'
              }}
            >
              <Image source={icons.pencil} className="w-6 h-6" tintColor="#6366F1" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSendPress}
              className="absolute -left-10 -top-10 w-16 h-16 bg-white rounded-full items-center justify-center shadow-lg"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.2,
                shadowRadius: 5,
                borderWidth: 2,
                borderColor: '#f0f0f0'
              }}
            >
              <Image source={icons.send} className="w-6 h-6" tintColor="#6366F1" />
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </Animated.View>
  );
};

export default StackCircle;
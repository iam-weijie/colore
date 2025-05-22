import { icons } from "@/constants";
import { isOnlyEmoji } from "@/lib/post";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Image,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import PinIcon from "./PinComponent";

type Stacks = {
  name: string;
  ids: number[]; // IDs of the posts in the stack
  elements: any[]; //! Elements of any type in the stack (Change to a specific type later)
  center: {
    x: number;
    y: number;
  }; // Center coords
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
  scrollOffset?: { x: number; y: number };
  onViewPress: () => void;
  onEditPress: () => void;
  onSendPress: () => void;
  enabledPan: () => void;
  stackMoving: () => void;
  updateStackPosition: (x: number, y: number, stack: Stacks) => void;
}) => {
  const SHOW_BUTTONS_THRESHOLD = 200;

  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const basePosition = useRef({
    x: stack?.center?.x ?? 0, // added null safety check
    y: stack?.center?.y ?? 0,
  }).current;

  const dragOffset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const shadowRadius = useRef(new Animated.Value(8)).current;
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isReadyToDrag = useRef(false);

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
            Animated.parallel([
              Animated.spring(scale, { toValue: 1.05, useNativeDriver: false }),
              Animated.spring(shadowRadius, { toValue: 16, useNativeDriver: false }),
            ]).start();
          }, 300);
        }
      },
      onPanResponderMove: (e, gestureState) => {
        if (isReadyToDrag.current) {
          dragOffset.setValue({ x: gestureState.dx, y: gestureState.dy });
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (longPressTimeout.current) {
          clearTimeout(longPressTimeout.current);
        }

        if (isReadyToDrag.current) {
          const offset = dragOffset.__getValue();

          const newX = basePosition.x + offset.x;
          const newY = basePosition.y + offset.y;

          basePosition.x = newX;
          basePosition.y = newY;

          updateStackPosition(newX, newY, stack);

          Animated.parallel([
            Animated.spring(scale, { toValue: 1, useNativeDriver: false }),
            Animated.spring(shadowRadius, { toValue: 8, useNativeDriver: false }),
          ]).start();
        }

        setIsDragging(false);
        stackMoving();
        isReadyToDrag.current = false;
      },
    })
  ).current;

  useEffect(() => {
    if (!isDragging) {
      basePosition.x = stack?.center?.x;
      basePosition.y = stack?.center?.y;
      dragOffset.setValue({ x: 0, y: 0 });
    }
  }, [stack?.center?.x, stack?.center?.y]); //TODO: Perform better nullity checks

  const shouldShowButtons = () => {
    const dx = Math.abs(scrollOffset.x + 120 - stack?.center?.x);
    const dy = Math.abs((scrollOffset.y + 160) - stack?.center?.y);
    const distance = Math.sqrt(dx * dx + dy * dy);
    setIsFocused(distance <= SHOW_BUTTONS_THRESHOLD && isEditable);
  };

  useEffect(() => {
    shouldShowButtons();
  }, [scrollOffset.x, scrollOffset.y, isEditable, stack.center]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      pointerEvents={isFocused ? "auto" : "none"}
      className="absolute items-center justify-center rounded-[48px] border-6 bg-white/90 border-white/80"
      style={[
        {
          top: basePosition.y - 110,
          left: basePosition.x - 40,
          width: 240,
          height: 320,
          shadowColor: "#9CA3AF",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: shadowRadius,
          elevation: 5,
          zIndex: isFocused ? 999 : 1,
          transform: [
            { translateX: dragOffset.x },
            { translateY: dragOffset.y },
            { scale: scale },
          ],
        },
      ]}
    >
      {/* Pin Component */}
      <View className="absolute top-0 w-full mx-auto items-center">
        <PinIcon size={40} />
      </View>

      {/* Stack Name */}
      <Text
        className="absolute top-12 w-full px-6 text-center text-black font-JakartaBold"
        numberOfLines={2}
        ellipsizeMode="tail"
        style={{ fontSize: isOnlyEmoji(stack.name) ? 40 : 20 }}
      >
        {stack.name}
      </Text>

      {/* Action Buttons */}
      <View className="absolute -bottom-[25px] flex-row justify-end items-center">
        {/* View Button */}
        <TouchableWithoutFeedback onPress={onViewPress}>
          <View className="rounded-full bg-black justify-center items-center mx-1" style={{ width: 100, height: 50 }}>
            <Text className="text-white font-JakartaBold" style={{ fontSize: 16 }}>View</Text>
          </View>
        </TouchableWithoutFeedback>

        {isEditable && (
          <>
            <TouchableWithoutFeedback onPress={onEditPress}>
              <View className="rounded-full bg-white justify-center items-center mx-1" style={{ width: 50, height: 50 }}>
                <Image source={icons.pencil} tintColor="black" resizeMode="contain" className="w-5 h-5" />
              </View>
            </TouchableWithoutFeedback>

            <TouchableWithoutFeedback onPress={onSendPress}>
              <View className="rounded-full bg-white justify-center items-center mx-1" style={{ width: 50, height: 50 }}>
                <Image source={icons.send} tintColor="black" resizeMode="contain" className="w-5 h-5" />
              </View>
            </TouchableWithoutFeedback>
          </>
        )}
      </View>
    </Animated.View>
  );
};

export default StackCircle;

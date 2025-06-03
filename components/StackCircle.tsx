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
} from "react-native";
import PinIcon from "./PinComponent";

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
    x: stack?.center?.x ?? 0,
    y: stack?.center?.y ?? 0,
  }).current;

  const dragOffset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const tilt = useRef(new Animated.Value(0)).current;

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
              Animated.spring(scale, { toValue: 1.08, useNativeDriver: false }),
              Animated.spring(tilt, { toValue: 1, useNativeDriver: false }),
            ]).start();
          }, 300);
        }
      },
      onPanResponderMove: (_, gesture) => {
        if (isReadyToDrag.current) {
          dragOffset.setValue({ x: gesture.dx, y: gesture.dy });
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (longPressTimeout.current) clearTimeout(longPressTimeout.current);

        if (isReadyToDrag.current) {
          const offset = dragOffset.__getValue();
          const newX = basePosition.x + offset.x;
          const newY = basePosition.y + offset.y;
          basePosition.x = newX;
          basePosition.y = newY;
          updateStackPosition(newX, newY, stack);
        }

        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: false }),
          Animated.spring(tilt, { toValue: 0, useNativeDriver: false }),
        ]).start();

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
  }, [stack.center.x, stack.center.y]);

  const shouldShowButtons = () => {
    const dx = Math.abs(scrollOffset.x + 120 - stack?.center?.x);
    const dy = Math.abs(scrollOffset.y + 160 - stack?.center?.y);
    const distance = Math.sqrt(dx * dx + dy * dy);
    setIsFocused(distance <= SHOW_BUTTONS_THRESHOLD && isEditable);
  };

  useEffect(() => {
    shouldShowButtons();
  }, [scrollOffset.x, scrollOffset.y, isEditable, stack.center]);

  const tiltInterpolation = tilt.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "3deg"],
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      className="absolute items-center justify-center"
      style={{
        top: basePosition.y - 110,
        left: basePosition.x - 40,
        width: 260,
        height: 340,
        transform: [
          { translateX: dragOffset.x },
          { translateY: dragOffset.y },
          { scale },
          { rotate: tiltInterpolation },
        ],
        zIndex: isFocused ? 999 : 1,
      }}
    >
      {/* Card */}
      <View className="w-full h-full rounded-[64px] bg-white/90 border border-white shadow-2xl items-center justify-center px-6 py-8 relative">

        {/* Pin */}
        <View className="absolute top-2">
          <PinIcon size={42} />
        </View>

        {/* Stack Name */}
        <Text
          className="text-black font-JakartaBold text-center"
          numberOfLines={2}
          ellipsizeMode="tail"
          style={{ fontSize: isOnlyEmoji(stack.name) ? 44 : 24 }}
        >
          {stack.name}
        </Text>

        {/* Post Count Bubble */}
        <View className="absolute top-[90px] bg-indigo-400 px-4 py-1.5 rounded-full shadow-md">
          <Text className="text-white font-bold text-sm">
            {stack.ids.length} posts
          </Text>
        </View>

        {/* View Button */}
        <TouchableOpacity
          onPress={onViewPress}
          className="absolute bottom-6 px-8 py-3 bg-black rounded-full shadow-lg"
        >
          <Text className="text-white font-JakartaBold text-lg">View</Text>
        </TouchableOpacity>

        {/* Orbit Buttons */}
        {isEditable && isFocused && (
          <>
            <TouchableOpacity
              onPress={onEditPress}
              className="absolute right-6 top-6 w-12 h-12 bg-white rounded-full items-center justify-center shadow"
            >
              <Image source={icons.pencil} className="w-6 h-6" tintColor="black" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSendPress}
              className="absolute left-6 top-6 w-12 h-12 bg-white rounded-full items-center justify-center shadow"
            >
              <Image source={icons.send} className="w-6 h-6" tintColor="black" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </Animated.View>
  );
};

export default StackCircle;

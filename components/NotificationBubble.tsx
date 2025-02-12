import React, { useState, useEffect, useRef } from "react";
import { Alert, Text, View } from "react-native";
import Animated, { BounceIn, FadeOut } from "react-native-reanimated";

interface NotificationBubbleProps {
  unread: number;
  color: string;
}

const NotificationBubble: React.FC<NotificationBubbleProps> = ({ unread, color }) => {
  
  // Don't display the notification bubble if unread count is 0
  if (unread === 0) return null;

  return (
    <Animated.View
      exiting={FadeOut.duration(200)}
      entering={BounceIn}
      className="absolute items-center font-JakartaBold justify-center w-6 h-6 rounded-full left-1/2 -top-[2px]"
      style={[{ backgroundColor: color }]}
    >
      <Text className="text-white font-bold">{unread}</Text>
    </Animated.View>
  );
};

export default NotificationBubble;

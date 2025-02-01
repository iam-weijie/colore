import { fetchAPI } from "@/lib/fetch";
import React, { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/clerk-expo";
import { NotificationBubbleProps } from "@/types/type";
import { Text, View } from "react-native";
import Animated, { BounceIn, FadeOut } from "react-native-reanimated";
import tailwind from 'tailwind-rn';  // Import tailwind

// Memoize the component to prevent unnecessary re-renders
const NotificationBubble: React.FC<NotificationBubbleProps> = React.memo(({ type }) => {
  const { user } = useUser();
  const [unRead, setUnRead] = useState(0);
  const [color, setColor] = useState("yellow");

  // Ref to track if the component is mounted
  const isMounted = useRef(true);

  // Ref to track previous unread count
  const prevUnRead = useRef(unRead);

  // Function to fetch unread notifications
  const fetchUserPostsNotifications = async () => {
    try {
      const response = await fetchAPI(
        `/api/posts/getUserUnReadComments?id=${user!.id}`,
        {
          method: "GET",
        }
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const data = response.data;
      const unread_comments = data.reduce((sum: number, entry: Any) => sum + entry.unread_comments, 0);
      const like_count = data.reduce((sum: number, entry: Any) => sum + entry.like_count, 0);

      // Return based on type (comments or likes)
      switch (type) {
        case "comments":
          return { unread: unread_comments, color: "#72B2FF" };
        // case "likes":
        //   return { unread: like_count, color: "#FF7272" };
        default:
          return { unread: 0, color: "gray" };
      }
    } catch (error) {
      return { unread: 0, color: "gray" }; // Return defaults on error
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchUserPostsNotifications();

      // Only update state if unread count has changed
      if (data.unread !== prevUnRead.current) {
        prevUnRead.current = data.unread; // Update the previous unread value
        setColor(data.color);
        setUnRead(data.unread);
      }
    };

    fetchData();

    // Set up polling every 5 seconds
    const interval = setInterval(fetchData, 5000);
    console.log("polling happened.");

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []); // Empty dependency array ensures effect runs once on mount

  // Hide the bubble if no notifications or if not the right type
  if (unRead === 0) return null;


  return (
    <Animated.View
      exiting={FadeOut.duration(200)}
      entering={BounceIn}
      className="absolute items-center justify-center w-6 h-6 rounded-full left-1/2 -top-[2px]"
      style={[
        { backgroundColor: color }, // Dynamically set background color
      ]}
    >
      <Text className="text-white font-bold">{unRead}</Text>
    </Animated.View>
  );
});

export default NotificationBubble;

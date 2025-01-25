import { fetchAPI } from "@/lib/fetch";
import React, { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/clerk-expo";
import { NotificationBubbleProps } from "@/types/type";
import { Text, View, StyleSheet } from "react-native";
import Animated, { BounceIn, FadeOut } from "react-native-reanimated";

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
      console.error("Failed to fetch user data:", error);
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
   console.log("polling happended.")
   
    
    // Cleanup on unmount
    
  }, []); // Empty dependency array ensures effect runs once on mount


  // Hide the bubble if no notifications or if not the right type
  if (unRead === 0) return null;
  console.log("and it re-rendered")
  return (
  
    <Animated.View
      exiting={FadeOut.duration(200)}
      entering={BounceIn}
      style={[
        styles.bubble,
        { backgroundColor: color },
      ]}
    >
      <Text style={styles.text}>{unRead}</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    borderRadius: 12,
    left: "55%",
    top: "-3%",
  },
  text: {
    color: "white",
    fontWeight: "bold",
  }
});

export default NotificationBubble;
import { fetchAPI } from "@/lib/fetch";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import { NotificationBubbleProps } from "@/types/type";
import { Text, View, StyleSheet } from "react-native";

const NotificationBubble: React.FC<NotificationBubbleProps> = ({ type }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unRead, setUnRead] = useState(0);
  const [color, setColor] = useState("yellow");

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
        //case "likes":
          //return { unread: like_count, color: "#FF7272" };
        default:
          return { unread: 0, color: "gray" };
      }
    } catch (error) {
      setError("Failed to fetch user data.");
      console.error("Failed to fetch user data:", error);
      return { unread: 0, color: "gray" }; // Return defaults on error
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await fetchUserPostsNotifications();
      setColor(data.color);
      setUnRead(data.unread);
      setLoading(false);

    };
    fetchData();

    // Optional: Set up polling every 30 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval); // Clear interval on unmount
  }, [unRead]); // 

  if (loading) return null; // Don't display anything while loading

  // Hide the bubble if no notifications or if not the right type
  if (unRead === 0) return null;

  return (
    <View
      style={[
        styles.bubble,
        { backgroundColor: color },
      ]}
    >
      <Text style={styles.text}>{unRead}</Text>
    </View>
  );
};

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
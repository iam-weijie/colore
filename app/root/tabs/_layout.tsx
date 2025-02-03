import NotificationBubble from "@/components/NotificationBubble";
import { fetchAPI } from "@/lib/fetch";
import { icons } from "@/constants";
import { Tabs } from "expo-router";
import { Alert, Image, ImageSourcePropType, View } from "react-native";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useNotification } from '@/notifications/NotificationContext'; // Assuming you have a notification context to manage global state
import { sendPushNotification } from '@/notifications/PushNotificationService'; // Assuming this handles the push notification


const TabIcon = ({
  source,
  focused,
  unread,
  color
}: {
  source: ImageSourcePropType;
  focused: boolean;
  unread: number;
  color: string;
}) => (
  <View className={`items-center justify-center ${focused ? "bg-general-300 rounded-full" : ""}`}>
    <View className={`w-12 h-12 items-center justify-center rounded-full ${focused ? "bg-gray-500" : ""}`}>
      <Image source={source} tintColor="white" resizeMode="contain" className="w-7 h-7" />
      {/* Display NotificationBubble only when there are notifications */}
      {unread > 0 && <NotificationBubble unread={unread} color={color} />}
    </View>
  </View>
);

const Layout = () => {
  const [notifications, setNotifications] = useState<any[]>([]); // State to hold notifications for each tab
  const { pushToken } = useNotification();
  const [unreadComments, setUnreadComments] = useState<number>(0); // Assuming you have a notification context that provides pushToken
  const { user } = useUser();

  // Function to fetch notifications for each tab
  const fetchNotifications = async (type: string) => {
    if (!user?.id) return; // Make sure user ID is available

    // Fetch notifications based on type (comments, likes, etc.)
    try {
      // Example: Fetch notifications for the "comments" type (can be modified to handle others)
      const response = await fetch(`/api/notifications/get${type}?id=${user.id}`);
      if (!response) {
        throw new Error("Response is undefined.");
      }
      const responseData = await response.json();
      const data = responseData.data;

      const unread_comments = data.reduce((sum, entry) => sum + entry.unread_comments, 0);
      setUnreadComments(unread_comments);
      setNotifications(data); // Update notifications state
    } catch (error) {
      console.error(error);
      return new Response(
        JSON.stringify({ error: "Failed to update notificaiton comments" }),
        {
          status: 500,
        }
      );
    }
  };

  const handleSendNotification = async (post, comment) => {
    if (!pushToken) {
      Alert.alert('Error', 'Push token or data not available. Make sure permissions are granted.');
      return;
    }

    const commentContent = comment.comment_content.slice(0, 120); // Truncate comment to first 120 characters

    
    // Send the push notification
    const notificationSent = await sendPushNotification(
      pushToken,
      `${comment.commenter_username} responded to your post`, // Title
      `${commentContent}`, // Body (truncated content)
      `comment`, // Type of notification
      {
        route: `/root/post/${post.id}`,
        params: {
          id: post.post_id,
          clerk_id: post.clerk_id,
          content: post.content,
          nickname: post.nickname,
          firstname: post.firstname,
          username: post.username,
          like_count: post.like_count,
          report_count: post.report_count,
          created_at: post.created_at,
          unread_comments: post.unread_comments,
        }
      }
    );

    // If notification was successfully sent, update the 'notified' status in the database. 
    if (notifications) {
      try {
        const response = await fetchAPI(`/api/notifications/updateNotifiedComments`, {
          method: "PATCH",
          body: JSON.stringify({
            commentId: comment.comment_id
          }),
        });

        if(response.error) {
          throw new Error(response.error);
        }
      } catch (error) {
        //console.error("Failed to fetch comment data:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update notificaiton comments" }),
          {
            status: 500,
          }
        );
      }
    }

    setNotifications([])
  };


  useEffect(() => {
    // Polling notifications when the app loads
    if (notifications) {
      notifications.forEach((post) => {
        post.comments.forEach((comment) => {
          handleSendNotification(post, comment);
        });
      });
    }

    // Polling notifications every 5 seconds
    const interval = setInterval(() => {
      fetchNotifications("Comments"); // Poll comments notifications
    }, 5000);

    return () => clearInterval(interval); // Cleanup interval when the component unmounts
  }, [notifications]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "white",
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#333333",
          borderRadius: 50,
          paddingBottom: 25,
          overflow: "hidden",
          marginHorizontal: 20,
          marginBottom: 20,
          height: 70,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "row",
          position: "absolute",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={icons.home}
              unread={0}
              color={"#FF7272"} // Needs to be changed with like notifications
            />
          ),
        }}
      />
      <Tabs.Screen
        name="personal-board"
        options={{
          title: "Chat",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={icons.chat}
              unread={0}
              color={"#FF7272"} // Needs to be changed with message notifications
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={icons.profile}
              unread={unreadComments}
              color={"#72B2FF"}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default Layout;

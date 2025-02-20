import NotificationBubble from "@/components/NotificationBubble";
import { fetchAPI } from "@/lib/fetch";
import { icons } from "@/constants";
import { Tabs } from "expo-router";
import { Alert, Image, ImageSourcePropType, View } from "react-native";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useNotification } from "@/notifications/NotificationContext"; // Assuming you have a notification context to manage global state
import { sendPushNotification } from "@/notifications/PushNotificationService"; // Assuming this handles the push notification
import { ConversationItem } from "@/types/type";

const TabIcon = ({
  source,
  focused,
  unread,
  color,
}: {
  source: ImageSourcePropType;
  focused: boolean;
  unread: number;
  color: string;
}) => (
  <View
    className={`items-center justify-center ${focused ? "bg-general-600 rounded-full" : ""}`}
  >
    <View
      className={`w-14 h-14 items-center justify-center rounded-full ${focused ? "bg-[#000000]" : ""}`}
    >
      {focused && (
        <Image
          source={source}
          tintColor="#ffffff"
          resizeMode="contain"
          className="w-10 h-10"
        />
      )}
      {!focused && (
        <Image
          source={source}
          tintColor="#000000"
          resizeMode="contain"
          className="w-9 h-9"
        />
      )}
      {/* Display NotificationBubble only when there are notifications */}
      {unread > 0 && <NotificationBubble unread={unread} color={color} />}
    </View>
  </View>
);

const Layout = () => {
  const [notifications, setNotifications] = useState<any[]>([]); // State to hold notifications for each tab
  const { pushToken } = useNotification();
  const [unreadComments, setUnreadComments] = useState<number>(0); // Assuming you have a notification context that provides pushToken
  const [unreadMessages, setUnreadMessages] = useState<number>(0); // Assuming you have a notification context that provides pushToken
  const { user } = useUser();

  // Function to fetch notifications for each tab
  const fetchNotifications = async (type: string) => {
    if (!user?.id) return; // Make sure user ID is available

    // Fetch notifications based on type (comments, likes, etc.)
    try {
      // Example: Fetch notifications for the "comments" type (can be modified to handle others)
      const response = await fetch(
        `/api/notifications/get${type}?id=${user.id}`
      );
      if (!response) {
        throw new Error("Response is undefined.");
      }
      const responseData = await response.json();
      const data = responseData.toNotify;
      const unread_count = responseData.unread_count;

      console.log("data", data, "unread_count", unread_count);

      if (type == "Comments") {
        setUnreadComments(unread_count);
      }
      if (type == "Messages") {
        console.log("unread_message", unread_count);
        setUnreadMessages(unread_count);
      }
      if (data.length > 0) {
        setNotifications((prev) => [...prev, ...data]);
      }
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

  const handleSendNotification = async (n, content, type) => {
    if (!pushToken) {
      Alert.alert(
        "Error",
        "Push token or data not available. Make sure permissions are granted."
      );
      return;
    }

    // Send the push notification
    if (type == "Comments") {
      const notificationContent = content.comment_content.slice(0, 120); // Truncate comment to first 120 characters
      const notificationSent = await sendPushNotification(
        pushToken,
        `${content.commenter_username} responded to your post`, // Title
        `${notificationContent}`, // Body (truncated content)
        `comment`, // Type of notification
        {
          route: `/root/post/${n.id}`,
          params: {
            id: n.post_id,
            clerk_id: n.clerk_id,
            content: n.content,
            nickname: n.nickname,
            firstname: n.firstname,
            username: n.username,
            like_count: n.like_count,
            report_count: n.report_count,
            created_at: n.created_at,
            unread_comments: n.unread_comments,
          },
        }
      );

      try {
        const response = await fetchAPI(
          `/api/notifications/updateNotifiedComments`,
          {
            method: "PATCH",
            body: JSON.stringify({
              commentId: content.comment_id,
            }),
          }
        );

        if (response.error) {
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

    if (type == "Messages") {
      // Pre-processing
      const notificationContent = content.message.slice(0, 120); // Truncate comment to first 120 characters
      const fetchUsername = async (id: string) => {
        try {
          const response = await fetchAPI(`/api/users/getUserInfo?id=${id}`);
          const userInfo = response.data[0];

          return userInfo.username || "";
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        }
      };

      const fetchConversation = async (id: string) => {
        try {
          const response = await fetchAPI(
            `/api/chat/getConversations?id=${content.senderId}`
          );

          const conversationInfo = response.data.filter((c: ConversationItem) => c.id == id);

          console.log("conversationInfo", conversationInfo);
          if (conversationInfo.length === 0) return null; // Handle empty results

          return {
            conversationId: conversationInfo[0].id,
            conversationOtherClerk: conversationInfo[0].clerk_id,
            conversationOtherName: conversationInfo[0].name,
          };
        } catch (error) {
          console.error("Failed to fetch conversation data:", error);
        }
      };

      const username = await fetchUsername(content.senderId);
      const conversation = await fetchConversation(n.conversationid);

      const notificationSent = await sendPushNotification(
        pushToken,
        `${username} sent you a message`, // Title
        `${notificationContent}`, // Body (truncated content)
        `comment`, // Type of notification
        {
          route: `/root/chat/conversation?conversationId=${n.conversationid}&otherClerkId=${conversation!.conversationOtherClerk}&otherName=${conversation?.conversationOtherName}`,
          params: {},
        }
      );

      try {
        console.log(content.id);
        const response = await fetchAPI(
          `/api/notifications/updateNotifiedMessages`,
          {
            method: "PATCH",
            body: JSON.stringify({
              messageId: content.id,
            }),
          }
        );

        if (response.error) {
          throw new Error(response.error);
        }
      } catch (error) {
        //console.error("Failed to fetch comment data:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update notificaiton messages" }),
          {
            status: 500,
          }
        );
      }
    }

    // When notification was successfully sent and  the 'notified' status is updated in the database.
    setNotifications([]);
  };

  useEffect(() => {
    // Polling notifications when the app loads
    if (notifications.length > 0) {
      notifications.forEach((n) => {
        if (n.messages) {
          n.messages.forEach((message: string) => {
            handleSendNotification(n, message, "Messages");
          });
        } else {
          n.comments.forEach((comment: string) => {
            handleSendNotification(n, comment, "Comments");
          });
        }
      });
    }

    // Polling notifications every 5 seconds
    const interval = setInterval(() => {
      fetchNotifications("Comments"); // Poll comments notifications
      fetchNotifications("Messages"); // Poll comments notifications
    }, 5000);

    return () => clearInterval(interval); // Cleanup interval when the component unmounts
  }, [notifications, user]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "white",
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#fafafa",
          borderRadius: 50,
          paddingRight: 15,
          paddingLeft: 15,
          paddingBottom: 30,
          overflow: "hidden",
          marginHorizontal: 30,
          marginBottom: 35,
          height: 80,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "row",
          position: "absolute",
          boxShadow: "0 0px 0px 3px rgba(0,0,0,1)",
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
          title: "Personal Board",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={icons.chat}
              unread={unreadMessages}
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

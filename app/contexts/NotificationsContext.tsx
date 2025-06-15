import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "@clerk/clerk-expo";
import { io } from "socket.io-client";
import { sendPushNotification } from "@/notifications/PushNotificationService";
import { fetchAPI } from "@/lib/fetch";

export type NotificationsContextType = {
  notifications: any[];
  storedNotifications: any[];
  unreadComments: number;
  unreadMessages: number;
  unreadRequests: number;
  unreadPersonalPosts: number;
  unreadLikes: number;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(
  undefined
);

// This function is designed to run in both the in-app polling and background fetch.
// It accepts the userId and pushToken as parameters so that it does not depend on hooks.
export const fetchNotificationsExternal = async (
  userId: string,
  pushToken: string
) => {
  try {
    const [
      userResponse,
      commentsResponse,
      messagesResponse,
      postResponse,
      friendRequestResponse,
      likesResponse,
    ] = await Promise.all([
      fetch(`/api/users/getUserInfo?id=${userId}`),
      fetch(`/api/notifications/getComments?id=${userId}`),
      fetch(`/api/notifications/getMessages?id=${userId}`),
      fetch(`/api/notifications/getUserPersonalPosts?id=${userId}`),
      fetch(`/api/friends/getFriendRequests?userId=${userId}`),
      fetch(`/api/notifications/getLikes?id=${userId}`),
    ]);

    const commentsData = await commentsResponse.json();
    const comments = commentsData.toNotify;
    const storedComments = commentsData.toStore;
    const unread_comments = commentsData.unread_count ?? 0;

    const messagesData = await messagesResponse.json();
    const messages = messagesData.toNotify;
    const unread_messages = messagesData.unread_count ?? 0;

    const personalPostsData = await postResponse.json();
    const personalPosts = personalPostsData.toNotify;
    const storedPosts = personalPostsData.toStore;
    const unread_posts = personalPostsData.unread_count ?? 0;

    const userResponseData = await userResponse.json();
    const mostRecentConnection = userResponseData.data[0].last_connection;

    const friendRequestData = await friendRequestResponse.json();
    const allFriendRequests = friendRequestData.data;

    const friendRequestsToNotify = allFriendRequests.filter(
      (request: any) =>
        new Date(request.created_at) > new Date(mostRecentConnection) &&
        request.notified === false &&
        (request.requestor === "UID1"
          ? request.user_id1 !== userId
          : request.user_id2 !== userId)
    );

    const friendRequests =
      friendRequestsToNotify.length > 0
        ? [{ userId, requests: friendRequestsToNotify }]
        : [];
    const unread_requests = friendRequests?.length ?? 0;

    const likesData = await likesResponse.json();
    const likes = likesData.toStore;
    const unread_likes = likesData.unread_likes;

    // Combine all notifications
    const allNotifications = [
      ...comments,
      ...messages,
      ...personalPosts,
      ...friendRequests,
    ];

    const allStoredNotifications = [
      ...storedComments,
      ...storedPosts,
      ...likes,
    ];

    // Process each notification and send push if needed.
    const processFetchedNotifications = async (notifications: any[]) => {
      // Check if notifications array is empty, then return early to avoid errors
      if (notifications.length === 0) {
        return; // Exit the function early
      }

      for (const n of allNotifications) {
        if (n.messages) {
          for (const message of n.messages) {
            await handleSendNotificationExternal(
              n,
              message,
              "Messages",
              pushToken
            );
          }
        }
        if (n.comments) {
          for (const comment of n.comments) {
            await handleSendNotificationExternal(
              n,
              comment,
              "Comments",
              pushToken
            );
          }
        }
        if (n.requests) {
          for (const request of n.requests) {
            await handleSendNotificationExternal(
              n,
              request,
              "Requests",
              pushToken
            );
          }
        }
        if (n.recipient_user_id) {
          await handleSendNotificationExternal(n, n, "Posts", pushToken);
        }
      }
    };

    processFetchedNotifications(allNotifications);
    return {
      notifs: allNotifications,
      history: allStoredNotifications,
      counts: [
        unread_comments,
        unread_messages,
        unread_posts,
        unread_requests,
        unread_likes,
      ],
    };
  } catch (error) {
    console.log("Failed to fetch external notification", error);
    return null;
  }
};

// Local copy of handleSendNotificationExternal to keep provider self-contained
const handleSendNotificationExternal = async (
  n: any,
  content: any,
  type: string,
  pushToken: string | null
) => {
  if (!pushToken) return;

  try {
    if (type === "Comments") {
      const notificationContent = content.comment_content.slice(0, 120);
      await sendPushNotification(
        pushToken,
        `${content.commenter_username} responded to your post`,
        notificationContent,
        "comment",
        {
          route: `/root/post/${n.post_id}`,
          params: { id: n.post_id },
        }
      );
    }

    if (type === "Messages") {
      // You can implement message push logic here if desired
    }

    if (type === "Requests") {
      if (content.requestor) {
        const username =
          content.requestor === "UID1"
            ? content.user1_username
            : content.user2_username;
        await sendPushNotification(
          pushToken,
          `${username} wants to be your friend!`,
          "Click here to accept their friend request",
          "request",
          {
            route: `/root/chat`,
            params: { tab: "Requests" },
          }
        );
      }
    }

    if (type === "Posts") {
      await sendPushNotification(
        pushToken,
        `${n.username} has posted on your board`,
        `${n.content}`,
        "post",
        {
          route: `/root/tabs/personal-board`,
          params: { boardId: n.boardId },
        }
      );
    }

    // Update backend flag
    await fetchAPI(`/api/notifications/updateNotified${type}`, {
      method: "PATCH",
      body: JSON.stringify({ id: content.id }),
    });
  } catch (error) {
    console.error("[NotificationsContext] Failed to send push notification:", error);
  }
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [storedNotifications, setStoredNotifications] = useState<any[]>([]);

  const [unreadComments, setUnreadComments] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadRequests, setUnreadRequests] = useState(0);
  const [unreadPersonalPosts, setUnreadPersonalPosts] = useState(0);
  const [unreadLikes, setUnreadLikes] = useState(0);

  const [pushToken, setPushToken] = useState<string | null>(null);

  // Load pushToken from storage
  useEffect(() => {
    AsyncStorage.getItem("pushToken").then(setPushToken);
  }, []);

  // Initial fetch and socket setup
  useEffect(() => {
    if (!user?.id || !pushToken) return;

    const fetchInitial = async () => {
      const result = await fetchNotificationsExternal(user.id, pushToken);
      if (!result) return;

      const { notifs, history, counts } = result;
      if (notifs.length > 0) {
        setStoredNotifications((prev) => [...prev, ...notifs]);
      } else {
        setStoredNotifications(history);
      }
      setNotifications(notifs);
      setUnreadComments(counts[0]);
      setUnreadMessages(counts[1]);
      setUnreadPersonalPosts(counts[2]);
      setUnreadRequests(counts[3]);
      setUnreadLikes(counts[4]);
    };

    fetchInitial();

    // Socket connection
    const socket = io(
      `wss://${process.env.EXPO_PUBLIC_SERVER_URL?.substring(8)}`,
      {
        transports: ["websocket"],
        query: { id: user.id },
      }
    );

    socket.on("connect", () => console.log("[NotificationsContext] socket connected"));
    socket.on("notification", ({ type, notification, content }) => {
      if (!(notification && type && content)) return;

      if (pushToken) {
        handleSendNotificationExternal(notification, content, type, pushToken);
      }

      setNotifications((prev) => [notification, ...prev]);
      setStoredNotifications((prev) => [notification, ...prev]);
      switch (type) {
        case "Comments":
          setUnreadComments((c) => c + 1);
          break;
        case "Messages":
          setUnreadMessages((c) => c + 1);
          break;
        case "Requests":
          setUnreadRequests((c) => c + 1);
          break;
        case "Posts":
          setUnreadPersonalPosts((c) => c + 1);
          break;
        case "Likes":
          setUnreadLikes((c) => c + 1);
          break;
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, pushToken]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        storedNotifications,
        unreadComments,
        unreadMessages,
        unreadRequests,
        unreadPersonalPosts,
        unreadLikes,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotificationsContext = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error(
      "useNotificationsContext must be used within a NotificationsProvider"
    );
  return ctx;
}; 
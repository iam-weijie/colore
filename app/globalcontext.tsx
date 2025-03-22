// GlobalProvider.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { fetchAPI } from "@/lib/fetch";
import { sendPushNotification } from "@/notifications/PushNotificationService";
import { Stacks } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { useNotification } from "@/notifications/NotificationContext";

// ===== Types & Constants =====
type GlobalContextType = {
  stacks: Stacks[];
  setStacks: React.Dispatch<React.SetStateAction<Stacks[]>>;
  notifications: any[];
  unreadComments: number;
  unreadMessages: number;
  unreadRequests: number;
  unreadPersonalPosts: number;
  lastConnection: Date;
  isIpad: boolean;
  replyTo: string | null;
  setReplyTo: React.Dispatch<React.SetStateAction<string | null>>;
  scrollTo: string | null;
  setScrollTo: React.Dispatch<React.SetStateAction<string | null>>;
};

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);
const screenWidth = Dimensions.get("screen").width;
const NOTIFICATION_TASK = "background-notification-fetch";

// ===== External Notification Fetch Logic =====
// This function is designed to run in both the in-app polling and background fetch.
// It accepts the userId and pushToken as parameters so that it does not depend on hooks.
export async function fetchNotificationsExternal(
  userId: string,
  pushToken: string
) {
  try {
    const [
      userResponse,
      commentsResponse,
      messagesResponse,
      postResponse,
      friendRequestResponse,
    ] = await Promise.all([
      fetch(`/api/users/getUserInfo?id=${userId}`),
      fetch(`/api/notifications/getComments?id=${userId}`),
      fetch(`/api/notifications/getMessages?id=${userId}`),
      fetch(`/api/notifications/getUserPersonalPosts?id=${userId}`),
      fetch(`/api/friends/getFriendRequests?userId=${userId}`),
    ]);
    
    const commentsData = await commentsResponse.json();
    const comments = commentsData.toNotify;

    const messagesData = await messagesResponse.json();
    const messages = messagesData.toNotify;

    const personalPostsData = await postResponse.json();
    const personalPosts = personalPostsData.toNotify;

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

    // Combine all notifications
    const allNotifications = [
      ...comments,
      ...messages,
      ...personalPosts,
      ...friendRequests,
    ];

    // Process each notification and send push if needed.
    const processFetchedNotifications = async (notifications: any[]) => {
      //console.log("notifications", notifications);
      // Check if notifications array is empty, then return early to avoid errors
      if (notifications.length === 0) {
        //console.log("No new notifications to process");
        return; // Exit the function early
      }
    
      for (const n of allNotifications) {
        //console.log("n", n)
        if (n.messages) {
          for (const message of n.messages) {
            await handleSendNotificationExternal(n, message, "Messages", pushToken);
          }
        }
        if (n.comments) {
          
          for (const comment of n.comments) {
            await handleSendNotificationExternal(n, comment, "Comments", pushToken);
          }
        }
        if (n.requests) {
          for (const request of n.requests) {
            await handleSendNotificationExternal(n, request, "Requests", pushToken);
          }
        }
        if(n.recipient_user_id) {
         console.log("n", n)
            await handleSendNotificationExternal(n, n, "Posts", pushToken);
           
        }
      }
    };

   
    processFetchedNotifications(allNotifications)
    return allNotifications;
  } catch (error) {
    console.error("Error fetching notifications externally", error);
    return
  }
}

// Helper function used by the external fetch
async function handleSendNotificationExternal(
  n: any,
  content: any,
  type: string,
  pushToken: string
) {
  if (!pushToken) return;
  
  try {
    if (type === "Comments") {
      const notificationContent = content.comment_content.slice(0, 120);
  
      console.log("n", n)
      await sendPushNotification(
        pushToken,
        `${content.commenter_username} responded to your post`,
        notificationContent,
        "comment",
        {
          route: `/root/post/${n.id}`,
          params: {
            id: n.post_id,
            clerk_id: n.user_id,
            content: n.content,
            nickname: n.nickname,
            firstname: n.firstname,
            username: n.username,
            like_count: n.like_count,
            report_count: n.report_count,
            created_at: n.created_at,
            unread_comments: n.unread_comments,
            color: n.color
          },
        }
      );
    }
    if (type === "Messages") {
      const notificationContent = content.message.slice(0, 120);
      // Optionally, fetch extra conversation info here...
      // For brevity, that part is omitted.
      // await sendPushNotification( ... );
    }
    if (type === "Requests") {
      const username =
        content.requestor === "UID1"
          ? content.user1_username
          : content.user2_username;
      await sendPushNotification(
        pushToken,
        `${username} wants to be your friend!`,
        "Click here to accept their friend request",
        "comment",
        {
          route: `/root/chat`,
          params: { tab: "Requests" },
        }
      );
    }
    if (type === "Posts") {
      const username = "Someone"
      await sendPushNotification(
        pushToken,
        `${username} has posted on your board`,
        `${n.content}`,
        "comment",
        {
          route: `/root/tabs/personal-board`,
          params: { },
        }
      );
    }

    await fetchAPI(`/api/notifications/updateNotified${type}`, {
      method: "PATCH",
      body: JSON.stringify({ id: content.id }),
    });
    console.log("Tried to patch")
  } catch (error) {
    console.error("Failed to send notification externally:", error);
  }
}

// ===== Background Fetch Task Definition =====
// Since the background task runs outside of React hooks, we retrieve the persisted user info.
TaskManager.defineTask(NOTIFICATION_TASK, async () => {
  try {
    const userId = await AsyncStorage.getItem("userId");
    const pushToken = await AsyncStorage.getItem("pushToken");

    if (!userId || !pushToken) {
      console.warn("Background fetch: missing userId or pushToken");
      return BackgroundFetch.Result.Failed;
    }
    await fetchNotificationsExternal(userId, pushToken);
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    console.error("Background Fetch failed:", error);
    return BackgroundFetch.Result.Failed;
  }
});

// ===== GlobalProvider Component =====
export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [stacks, setStacks] = useState<Stacks[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadComments, setUnreadComments] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [unreadPersonalPosts, setUnreadPersonalPosts] = useState<number>(0);
  const [unreadRequests, setUnreadRequests] = useState<number>(0);
  const [lastConnection, setLastConnection] = useState<Date>(new Date(0));
  const [isIpad, setIsIpad] = useState<boolean>(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [scrollTo, setScrollTo] = useState<string | null>(null);

  const hasUpdatedLastConnection = useRef(false);
  const { user } = useUser();
  const { pushToken } = useNotification();

  // In-app polling every 5 seconds
  useEffect(() => {
    if (user && pushToken) {
      // When user signs in, persist the necessary info for background tasks.
      AsyncStorage.setItem("userId", user.id);
      AsyncStorage.setItem("pushToken", pushToken);

      // Initial fetch and then polling every 5 seconds
      fetchNotifications();
      updateLastConnection();
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
      
      
    }
  }, [user, pushToken]);

  // In-app fetchNotifications function that uses the external function
  const fetchNotifications = async () => {
    if (!user?.id || !pushToken) return;
    try {
      const notifs = await fetchNotificationsExternal(user.id, pushToken);

      // For UI state, update unread counts, last connection, etc.
      // (You can parse the responses as needed; here we simply set the notifications.)
      setNotifications(notifs);
      // (Update other state as needed based on your API responses.)
    } catch (error) {
      console.error("Error in in-app fetchNotifications", error);
    }
  };

  // Example function to update the last connection (as before)
  const updateLastConnection = async () => {
    if (user && !hasUpdatedLastConnection.current) {
      try {
        const response = await fetchAPI(`/api/users/updateUserLastConnection`, {
          method: "PATCH",
          body: JSON.stringify({ clerkId: user.id }),
        });
        if (response.error) {
          throw new Error(response.error);
        }
        hasUpdatedLastConnection.current = true;
      } catch (error) {
        console.error("Failed to update user last connection:", error);
      }
    }
  };

  // Register the background fetch task on mount
  useEffect(() => {
    if (user) {
      const registerBackgroundFetch = async () => {
        await BackgroundFetch.registerTaskAsync(NOTIFICATION_TASK, {
          minimumInterval: 60 * 15, // 15 minutes
          stopOnTerminate: false,
          startOnBoot: true,
        });
        await BackgroundFetch.setMinimumIntervalAsync(60 * 15);
      };
      registerBackgroundFetch();
      return () => {
        BackgroundFetch.unregisterTaskAsync(NOTIFICATION_TASK);
      };
    }
  }, [user]);

  useEffect(() => {
    setIsIpad(screenWidth > 500);
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        stacks,
        setStacks,
        notifications,
        unreadComments,
        unreadMessages,
        unreadPersonalPosts,
        unreadRequests,
        lastConnection,
        isIpad,
        replyTo,
        setReplyTo,
        scrollTo,
        setScrollTo
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
};

export default GlobalProvider;
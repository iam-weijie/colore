import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { fetchAPI } from "@/lib/fetch";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import PostModal from "@/components/PostModal";
import { Post } from "@/types/type";

interface NotificationContextType {
  pushToken: string | null;
  scheduleNotification: (title: string, body: string) => void;
}

// Create Context
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// Configure how notifications are displayed when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const { user } = useUser();

  const [post, setPost] = useState<Post>();


  const fetchPost = async (id: string) => {
        try {
              const response = await fetchAPI(`/api/posts/getPostsById?ids=${id}`)

              const data = response.data[0]

              setPost(data)
            } catch (error) {
              console.log("[Notifications] Failed to fetch post: ", error)
            }
  }
  useEffect(() => {
    const registerForPushNotifications = async () => {
      if (Device.isDevice) {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.warn("Failed to get push token for push notification!");
          return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync();

        
        setPushToken(tokenData.data);

        // Sending PushToken to Database
        sendTokenDB(tokenData.data)

        // console.log("Expo Push Token:", tokenData.data);
      } else {
        console.warn("Must use a physical device for push notifications.");
      }
    };

    registerForPushNotifications();

    // Listener for foreground notifications
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification Received:", notification);
      });

    // Listener for when a notification is tapped (this works even in background)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // console.log("Notification Clicked:", response);
        const { notification } = response;
        const { data } = notification.request.content; // Get the custom data

        // Handle different actions based on notification data
        if (data) {
          if (data.type === "comment") {

            console.log("Navigating to post", data.path.params)

            fetchPost(data.path.params!.id)
            
           /* router.push({
              pathname: data.path.route,
              // send through params to avoid doing another API call for post
              params: {
                id: data.path.params!.id,
                clerk_id: data.path.params!.clerk_id,
                content: data.path.params!.content,
                nickname: data.path.params!.nickname,
                firstname: data.path.params!.firstname,
                username: data.path.params!.username,
                like_count: data.path.params!.like_count,
                report_count: data.path.params!.report_count,
                created_at: data.path.params!.created_at,
                unread_comments: data.path.params!.unread_comments,
                color: data.path.params!.color,
              },
            });*/
          }

        
        }
      });

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const sendTokenDB = async (token) => {
    // PushToken to Database
    try {
      await fetchAPI(`/api/notifications/updatePushToken`, {
        method: "PATCH",
        body: JSON.stringify({
          clerkId: user?.id,
          pushToken: token,
        })
      })
  }
catch(error) {
    console.error("Failed to update unread message:", error);
  }
  }
  
  const scheduleNotification = async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
      },
      trigger: { seconds: 2 }, // Trigger after 2 seconds
    });
  };

  return (
    <NotificationContext.Provider value={{ pushToken, scheduleNotification }}>
      <>
      {children}
      {!!post && <PostModal
       isVisible={!!post} 
       selectedPosts={post ? [post] : []}
       handleCloseModal={() => {setPost(undefined)}}
       seeComments />}
      </>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

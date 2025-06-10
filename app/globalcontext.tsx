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
import { BackgroundFetchResult } from "expo-background-fetch"; // Import the Result enum
import * as TaskManager from "expo-task-manager";
import { fetchAPI } from "@/lib/fetch";
import { sendPushNotification } from "@/notifications/PushNotificationService";
import { Stacks, Post, UserProfileType, PostItColor } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { useNotification } from "@/notifications/NotificationContext";
import { set } from "date-fns";
import { temporaryColors } from "@/constants";

// ===== Types & Constants =====
type GlobalContextType = {
  stacks: Stacks[];
  setStacks: React.Dispatch<React.SetStateAction<Stacks[]>>;
  profile: UserProfileType;
  setProfile: React.Dispatch<React.SetStateAction<UserProfileType>>;
  refreshProfile: () => void;
  userColors: PostItColor[];
  setUserColors: React.Dispatch<React.SetStateAction<PostItColor[]>>;
  draftPost: Post;
  setDraftPost: React.Dispatch<React.SetStateAction<Post | null>>;
  resetDraftPost: () => void;
  notifications: any[];
  storedNotifications: any[];
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
  // New settings state
  hapticsEnabled: boolean;
  setHapticsEnabled: (
    value: boolean | ((prevState: boolean) => boolean)
  ) => void; // Use custom setter type
  soundEffectsEnabled: boolean;
  setSoundEffectsEnabled: (
    value: boolean | ((prevState: boolean) => boolean)
  ) => void; // Use custom setter type
};

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);
const screenWidth = Dimensions.get("screen").width;
const NOTIFICATION_TASK = "background-notification-fetch";
const HAPTICS_ENABLED_KEY = "hapticsEnabled";
const SOUND_EFFECTS_ENABLED_KEY = "soundEffectsEnabled";

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

    // Combine all notifications
    const allNotifications = [
      ...comments,
      ...messages,
      ...personalPosts,
      ...friendRequests,
    ];

    const allStoredNotifications = [...storedComments, ...storedPosts];
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
          console.log("n", n);
          await handleSendNotificationExternal(n, n, "Posts", pushToken);
        }
      }
    };

    processFetchedNotifications(allNotifications);
    return {
      notifs: allNotifications,
      history: allStoredNotifications,
      counts: [unread_comments, unread_messages, unread_posts, unread_requests],
    };
  } catch (error) {
    console.error("Error fetching notifications externally", error);
    return;
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

      console.log("n", n);
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
            color: n.color,
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
          ? content.user1_nickname
          : content.user2_nickname;
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
      const username = "Someone";
      await sendPushNotification(
        pushToken,
        `${username} has posted on your board`,
        `${n.content}`,
        "comment",
        {
          route: `/root/tabs/personal-board`,
          params: {},
        }
      );
    }

    await fetchAPI(`/api/notifications/updateNotified${type}`, {
      method: "PATCH",
      body: JSON.stringify({ id: content.id }),
    });
    console.log("Tried to patch");
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
      return BackgroundFetchResult.Failed; // Use BackgroundFetchResult enum
    }
    await fetchNotificationsExternal(userId, pushToken);
    return BackgroundFetchResult.NewData; // Use BackgroundFetchResult enum
  } catch (error) {
    console.error("Background Fetch failed:", error);
    return BackgroundFetchResult.Failed; // Use BackgroundFetchResult enum
  }
});

// ===== GlobalProvider Component =====
export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [stacks, setStacks] = useState<Stacks[]>([]);
  const [draftPost, setDraftPost] = useState<Post | null>({
    id: 0,
    clerk_id: "",
    firstname: "",
    username: "",
    nickname: "",
    incognito_name: "",
    content: "",
    created_at: "",
    expires_at: "",
    available_at: "",
    static_emoji: false,
    city: "",
    state: "",
    country: "",
    like_count: 0,
    report_count: 0,
    unread_comments: 0,
    recipient_user_id: "",
    pinned: false,
    color: "",
    emoji: "",
    notified: false,
    prompt_id: 0,
    prompt: "",
    board_id: 0,
    reply_to: 0,
    unread: false,
    formatting: [], // Add a default value for formatting
  });
  const [profile, setProfile] = useState<UserProfileType>();
  const [userColors, setUserColors] = useState<PostItColor[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [storedNotifications, setStoredNotifications] = useState<any[]>([]);
  const [unreadComments, setUnreadComments] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [unreadPersonalPosts, setUnreadPersonalPosts] = useState<number>(0);
  const [unreadRequests, setUnreadRequests] = useState<number>(0);
  const [lastConnection, setLastConnection] = useState<Date>(new Date(0));
  const [isIpad, setIsIpad] = useState<boolean>(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [scrollTo, setScrollTo] = useState<string | null>(null);

  // New state for settings
  const [hapticsEnabled, setHapticsEnabledState] = useState<boolean>(true); // Default to true
  const [soundEffectsEnabled, setSoundEffectsEnabledState] =
    useState<boolean>(true); // Default to true

  const fetchUserProfile = async () => {
      if (user) {
        try {
          const response = await fetchAPI(
            `/api/users/getUserInfo?id=${user.id}`,
            {
              method: "GET",
            }
          );
          if (response.error) {
            throw new Error(response.error);
          }
          const userData = response.data[0];
          if (!userData.nickname || !userData.incognito_name) {
            try {
              const response = await fetchAPI("/api/users/patchUserInfo", {
                method: "PATCH",
                body: JSON.stringify(
                  !userData.nickname && !userData.incognito_name
                    ? {
                        clerkId: user!.id,
                        incognito_name: generateRandomUsername(),
                        nickname: userData.username,
                      }
                    : !userData.nickname
                      ? {
                          clerkId: user!.id,
                          nickname: userData.nickname,
                        }
                      : {
                          clerkId: user!.id,
                          incognito_name: generateRandomUsername(),
                        }
                ),
              });

              if (response.error) {
                throw new Error(response.error);
              }
              console.log("updated placeholder names on start successfully");
            } catch (error) {
              console.error(
                "Failed to update placeholder names on start:",
                error
              );
            }
          }
          setProfile(userData);
          setUserColors(userData.colors || temporaryColors);
          setLastConnection(new Date(userData.last_connection));
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      }
    };

  const hasUpdatedLastConnection = useRef(false);
  const { user } = useUser();
  const { pushToken } = useNotification();

  const generateRandomUsername = () => {
    const words1 = [
      "Blue",
      "Green",
      "Fast",
      "Silent",
      "Fuzzy",
      "Bright",
      "Dark",
      "Happy",
      "Wild",
      "Brave",
    ];
    const words2 = [
      "Tiger",
      "Eagle",
      "Lion",
      "Wolf",
      "Panther",
      "Dragon",
      "Falcon",
      "Shark",
      "Phoenix",
      "Rhino",
    ];

    const randomWord1 = words1[Math.floor(Math.random() * words1.length)];
    const randomWord2 = words2[Math.floor(Math.random() * words2.length)];
    const randomNumber = Math.floor(Math.random() * 1000);
    return `${randomWord1}${randomWord2}${randomNumber}`;
  }

  const resetDraftPost = () => {
    setDraftPost({
      id: 0,
      clerk_id: "",
      firstname: "",
      username: "",
      nickname: "",
      incognito_name: "",
      content: "",
      created_at: new Date().toISOString(),
      expires_at: "",
      available_at: "",
      static_emoji: false,
      city: "",
      state: "",
      country: "",
      like_count: 0,
      report_count: 0,
      unread_comments: 0,
      recipient_user_id: "",
      pinned: false,
      color: "",
      emoji: "",
      notified: false,
      prompt_id: 0,
      prompt: "",
      board_id: -1,
      reply_to: 0,
      unread: false,
      formatting: [],
    });
  };

  const refreshProfile = async () => {
    fetchUserProfile();
  }

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

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  // In-app fetchNotifications function that uses the external function
  const fetchNotifications = async () => {
    if (!user?.id || !pushToken) return;
    try {
      const result = await fetchNotificationsExternal(user.id, pushToken);
      if (result) {
        // For UI state, update unread counts, last connection, etc.
        // (You can parse the responses as needed; here we simply set the notifications.)
        const { notifs, history, counts } = result;
        if (notifs.length > 0) {
          const prevNotifications = storedNotifications;
          setStoredNotifications([...prevNotifications, ...notifs]);
        } else {
          // console.log("history", history.length)
          setStoredNotifications(history);
        }

        setNotifications(notifs);
        setUnreadComments(counts[0]);
        setUnreadMessages(counts[1]);
        setUnreadPersonalPosts(counts[2]);
        setUnreadRequests(counts[3]);
      }

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

  // Register New Push Token

  const sendTokenDB = async (token) => {
    // PushToken to Database

    console.log("sending it");
    try {
      await fetchAPI(`/api/notifications/updatePushToken`, {
        method: "PATCH",
        body: JSON.stringify({
          clerkId: user?.id,
          pushToken: token,
        }),
      });
    } catch (error) {
      console.error("Failed to update unread message:", error);
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
    sendTokenDB(pushToken);
  }, []);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const hapticsSetting = await AsyncStorage.getItem(HAPTICS_ENABLED_KEY);
        const soundSetting = await AsyncStorage.getItem(
          SOUND_EFFECTS_ENABLED_KEY
        );

        if (hapticsSetting !== null) {
          setHapticsEnabledState(JSON.parse(hapticsSetting));
        }
        if (soundSetting !== null) {
          setSoundEffectsEnabledState(JSON.parse(soundSetting));
        }
      } catch (e) {
        console.error("Failed to load settings.", e);
      }
    };
    loadSettings();
  }, []);

  // Wrap setters to also save to AsyncStorage
  const setHapticsEnabled = (
    value: boolean | ((prevState: boolean) => boolean)
  ) => {
    const newValue =
      typeof value === "function" ? value(hapticsEnabled) : value;
    setHapticsEnabledState(newValue);
    AsyncStorage.setItem(HAPTICS_ENABLED_KEY, JSON.stringify(newValue)).catch(
      (e) => console.error("Failed to save haptics setting.", e)
    );
  };

  const setSoundEffectsEnabled = (
    value: boolean | ((prevState: boolean) => boolean)
  ) => {
    const newValue =
      typeof value === "function" ? value(soundEffectsEnabled) : value;
    setSoundEffectsEnabledState(newValue);
    AsyncStorage.setItem(
      SOUND_EFFECTS_ENABLED_KEY,
      JSON.stringify(newValue)
    ).catch((e) => console.error("Failed to save sound setting.", e));
  };

  return (
    <GlobalContext.Provider
      value={{
        stacks,
        setStacks,
        draftPost,
        profile,
        setProfile,
        refreshProfile,
        userColors,
        setUserColors,
        setDraftPost,
        resetDraftPost,
        notifications,
        storedNotifications,
        unreadComments,
        unreadMessages,
        unreadPersonalPosts,
        unreadRequests,
        lastConnection,
        isIpad,
        replyTo,
        setReplyTo,
        scrollTo,
        setScrollTo,
        // Add new settings state and setters
        hapticsEnabled,
        setHapticsEnabled, // Use wrapped setter
        soundEffectsEnabled,
        setSoundEffectsEnabled, // Use wrapped setter
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

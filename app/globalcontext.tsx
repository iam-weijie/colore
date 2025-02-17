import React, { createContext, useContext, useState, useEffect } from "react";
import { Stacks } from "@/types/type";
import { fetchAPI } from "@/lib/fetch";
import { sendPushNotification } from "@/notifications/PushNotificationService";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useNotification } from '@/notifications/NotificationContext'; // Assuming you have a notification context to manage global state


// Types for global state
type GlobalContextType = {
  stacks: Stacks[];
  setStacks: React.Dispatch<React.SetStateAction<Stacks[]>>;
  notifications: any[]; 
  unreadComments: number;
  unreadMessages: number;
  unreadRequests: number;
  lastConnection: Date;
};

// Constants
const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stacks, setStacks] = useState<Stacks[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadComments, setUnreadComments] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [unreadRequests, setUnreadRequests] = useState<number>(0);
  const [lastConnection, setLastConnection] = useState<Date>(new Date(0));
  
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { pushToken } = useNotification();

    // Process the fetched notifications (send push notifications for each)
    const processFetchedNotifications = (notifications: any[]) => {
      console.log("notifications", notifications)
      notifications.forEach((n) => {
        if (n.messages) {
          n.messages.forEach((message) => {
            handleSendNotification(n, message, "Messages");
          });
        } 
        if (n.comments) {
          n.comments.forEach((comment) => {
            handleSendNotification(n, comment, "Comments");
          });
        }
        if(n.requests) {
          n.requests.forEach((request) => {
            console.log("exact request", request)
            handleSendNotification(n, request, "Requests")
          });
        }
      });
    };

  // Fetch notifications for both Comments and Messages
  const fetchNotifications = async () => {
    if (!user?.id) return; // Ensure the user is available

    try {
      const [commentsResponse, messagesResponse, userResponse, friendRequestResponse] = await Promise.all([
        fetch(`/api/notifications/getComments?id=${user.id}`),
        fetch(`/api/notifications/getMessages?id=${user.id}`),
        fetch(`/api/users/getUserInfo?id=${user.id}`),
        fetch(`/api/friends/getFriendRequests?userId=${user.id}`)
      ]);
      
     
      // Handle the Comments response
      const commentsData = await commentsResponse.json();
      const comments = commentsData.toNotify;
      const unreadCommentsCount = commentsData.unread_count;

      setUnreadComments(unreadCommentsCount);

      // Handle the Messages response
      const messagesData = await messagesResponse.json();
      const messages = messagesData.toNotify;
      const unreadMessagesCount = messagesData.unread_count;

      setUnreadMessages(unreadMessagesCount);

      // Handle the Friend Requests response
      const userResponseData =  await userResponse.json();
      console.log(userResponseData)
      const mostRecentConnection = userResponseData.data[0].last_connection
      setLastConnection(mostRecentConnection)

      const friendRequestData = await friendRequestResponse.json();
      const allFriendResquests = friendRequestData.data
      
      const friendRequestsToNotify = allFriendResquests.filter((request) => 
        new Date(request.created_at) > new Date(mostRecentConnection) 
        && request.notified == false 
        && (request.requestor == "UID1" ? (request.user_id1 != user.id) : (request.user_id2 != user.id))
    ) 
      const friendRequests = friendRequestsToNotify.length > 0 ? [{userId: user.id, requests: friendRequestsToNotify}] : []

      setUnreadRequests(friendRequestsToNotify.length)

      //console.log(friendRequests)
      // Combine both comments and messages into one list of notifications
      const allNotifications = [...comments, ...messages, ...friendRequests];
      setNotifications(allNotifications);

      //console.log("All notificaitons", allNotifications)
      // Process the fetched notifications (send push notifications)
      processFetchedNotifications(allNotifications);

    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  };

  // Handle sending notifications based on content type (e.g., Comments, Messages)
  const handleSendNotification = async (n: any, content: any, type: string) => {
    if (!pushToken) {
      return;
    }

    try {
      if (type === "Comments") {
        const notificationContent = content.comment_content.slice(0, 120);
        await sendPushNotification(
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
                }
              }
            );
      }

      if (type === "Messages") {
        const notificationContent = content.message.slice(0, 120);

        const fetchUsername = async (id: string) => {
                try {
                  const response = await fetchAPI(`/api/users/getUserInfo?id=${id}`);
                  const userInfo = response.data[0];
        
                  return userInfo.username || ""
                  
                } catch (error) {
                  console.error("Failed to fetch user data:", error);
                }
              };
        
              const fetchConversation = async (id: string) => {
                try {
                  const response = await fetchAPI(`/api/chat/getConversations?id=${content.senderId}`);
                  
                  const conversationInfo = response.data.filter((c) => c.id == id);
        
                  console.log("conversationInfo", conversationInfo)
                  if (conversationInfo.length === 0) return null; // Handle empty results
        
                  return {
                    conversationId: conversationInfo[0].id,
                    conversationOtherClerk: conversationInfo[0].clerk_id,
                    conversationOtherName: conversationInfo[0].name
                  };
                  
                } catch (error) {
                  console.error("Failed to fetch conversation data:", error);
                }
              };  

              const username = await fetchUsername(content.senderId)
              const conversation = await fetchConversation(n.conversationid)
              
       await sendPushNotification(
             pushToken,
             `${username} sent you a message`, // Title
             `${notificationContent}`, // Body (truncated content)
             `comment`, // Type of notification
             {
               route: `/root/chat/conversation?conversationId=${n.conversationid}&otherClerkId=${conversation.conversationOtherClerk}&otherName=${conversation.conversationOtherName}`,
               params: {}
             }
           );
      }
      if (type === "Requests") {
        console.log("request", content)
        const username = content.requestor == "UID1" ? content.user1_username : content.user2_username
        await sendPushNotification(
          pushToken,
          `${username} wants to be your friend!`, // Title
          "Click here to accept their friend request", // Body (truncated content)
          `comment`, // Type of notification
          {
            route: `/root/chat`,
            params: {tab: "Requests"}
          }
        );
      }

      // Mark notifications as notified in the backend
      const updateResponse = await fetchAPI(`/api/notifications/updateNotified${type}`, {
        method: "PATCH",
        body: JSON.stringify({ id: content.id }),
      });

      if (updateResponse.error) {
        throw new Error(updateResponse.error);
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
    }

     // When notification was successfully sent and  the 'notified' status is updated in the database. 
     //setNotifications([])
  };

  const updateLastConnection = async () => {
        if (user) {
          try {
            const response = await fetchAPI(`/api/users/updateUserLastConnection`,  {
              method: "PATCH",
              body: JSON.stringify({
                clerkId: user?.id,
              }),
            });
  
            if (response.error) {
              throw new Error(response.error);
            }
          } catch (error) {
            console.error("Failed to update user last connection:", error);
          } 
        }
      };

  // Poll notifications every 5 seconds
  useEffect(() => {
    if (user) {
      fetchNotifications(); // Initial fetch
      const interval = setInterval(() => {
        fetchNotifications(); // Poll notifications every 5 seconds
        updateLastConnection();
      }, 5000);

      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [user]);

  useEffect(() => {
    updateLastConnection()
  }, [isSignedIn])

  return (
    <GlobalContext.Provider value={{
      stacks,
      setStacks,
      notifications,
      unreadComments,
      unreadMessages,
      unreadRequests,
      lastConnection
    }}>
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

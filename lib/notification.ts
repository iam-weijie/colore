import { sendPushNotification } from "@/notifications/PushNotificationService";
import { fetchAPI } from "@/lib/fetch";

export const sendNotification = async (
  recipientId: string,
  type: string,
  notification: any,
  content: any
) => {
  try {
    const res = await fetch(`${process.env.EXPO_PUBLIC_SERVER_URL}/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId,
        type,
        notification,
        content,
      }),
    });

    const data = await res.json();

    console.log(data.message!);

    // attempting to send push notif
    // failed to send notification through sockets as notif recipient was offline
    if (!data.success) {
      console.log("Dispatching push notification...");

      const res = await fetchAPI(`/api/notifications/getPushToken`, {
        method: "GET",
        body: JSON.stringify({
          userId: recipientId,
        }),
      });

      if (res.error) {
        throw new Error(res.error);
      }

      const recipientPushToken = res.data.push_token;

      await handleSendNotificationExternal(
        notification,
        content,
        type,
        recipientPushToken
      );
    }
  } catch (error) {
    console.log("Failed to send notification: ", error);
  }
};

export const handleSendNotificationExternal = async (
  notification: any,
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
          route: `/root/post/${notification.post_id}`,
          params: {
            id: notification.post_id,
            clerk_id: notification.user_id,
            content: notification.content,
            nickname: notification.nickname,
            firstname: notification.firstname,
            username: notification.username,
            like_count: notification.like_count,
            report_count: notification.report_count,
            created_at: notification.created_at,
            unread_comments: notification.unread_comments,
            color: notification.color,
          },
        }
      );
    }
    if (type === "Requests") {
      // sending out notification for sending friend request
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

        // sending out notification for accepting friend request
      } else if (content.receiver_username) {
        await sendPushNotification(
          pushToken,
          `${content.receiver_username} accepted your friend request!`,
          "Say hello",
          "request",
          {
            route: `/root/chat`,
            params: { tab: "Requests" },
          }
        );
      }
    }
    if (type === "Posts") {
      //const username = "Someone";
      await sendPushNotification(
        pushToken,
        `${notification.username} has posted on your board`,
        `${notification.content}`,
        "post",
        {
          route: `/root/tabs/personal-board`,
          params: {
            boardId: notification.boardId,
          },
        }
      );
    }
    if (type == "Likes") {
      // handling a post like
      if (notification.comment_id) {
        const notificationContent = notification.comment_content.slice(0, 120);

        await sendPushNotification(
          pushToken,
          `${notification.liker_username} liked your comment`,
          notificationContent,
          "like",
          {
            route: `/root/posts/${notification.post_id}`,
            params: {
              content: notification.comment_content,
            },
          }
        );
      } else if (notification.post_id) {
        const notificationContent = notification.post_content.slice(0, 120);

        await sendPushNotification(
          pushToken,
          `${notification.liker_username} liked your post`,
          notificationContent,
          "like",
          {
            route: `/root/posts/${notification.post_id}`,
            params: {
              content: notification.post_content,
              color: notification.post_color,
            },
          }
        );
      }
      return; // no need to updateNotified for likes
    }
    if (type == "Likes") {
      // handling a post like
      if (notification.comment_id) {
        const notificationContent = notification.comment_content.slice(0, 120);

        await sendPushNotification(
          pushToken,
          `${notification.liker_username} liked your comment`,
          notificationContent,
          "like",
          {
            route: `/root/posts/${notification.post_id}`,
            params: {
              content: notification.comment_content,
            },
          }
        );
      } else if (notification.post_id) {
        const notificationContent = notification.post_content.slice(0, 120);

        await sendPushNotification(
          pushToken,
          `${notification.liker_username} liked your post`,
          notificationContent,
          "like",
          {
            route: `/root/posts/${notification.post_id}`,
            params: {
              content: notification.post_content,
              color: notification.post_color,
            },
          }
        );
      }
      return; // no need to use updateNotified for likes
    }

    await fetchAPI(`/api/notifications/updateNotified${type}`, {
      method: "PATCH",
      body: JSON.stringify({ id: content.id }),
    });
    console.log("Tried to patch");
  } catch (error) {
    console.error("Failed to send notification externally:", error);
  }
};

export const sendPushNotification = async (
  pushToken: string,
  title: string,
  message: string,
  type: string,
  path: { route: string; params: object }
) => {
  const messagePayload = {
    to: pushToken,
    sound: "default",
    title,
    body: message,
    data: {
      type: type,
      path: path,
    },
  };

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messagePayload),
    });

    const data = await response.json();
    // console.log('Push notification sent:', data);
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

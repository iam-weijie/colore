
export const sendPushNotification = async (pushToken: string, title: string, message: string) => {
  const messagePayload = {
    to: pushToken,
    sound: 'default',
    title,
    body: message,
    data: { someData: 'goes here' },
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });

    const data = await response.json();
    console.log('Push notification sent:', data);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

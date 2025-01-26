import { useEffect, useState } from 'react';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { useUser } from '@clerk/clerk-expo';

export const DeviceToken = () => {
  const { user } = useUser();
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  useEffect(() => {
    const updateDeviceToken = async () => {
      if (!user || !user.id) return;

      // Fetch the current user data from your backend
      const response = await fetch(`/api/users/${user.id}`);
      const userData = await response.json();

      if (!userData.device_token) {
        // Request a new device token
        PushNotificationIOS.requestPermissions().then((data) => {
          console.log('PushNotificationIOS.requestPermissions', data);
        });

        PushNotificationIOS.addEventListener('register', async (token) => {
          setDeviceToken(token);

          // Send the device token to the server
          await fetch('/api/users/newDeviceToken', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id, deviceToken: token }),
          });
        });

        PushNotificationIOS.addEventListener('registrationError', (error) => {
          console.error('Failed to register for push notifications:', error);
        });
      } else {
        setDeviceToken(userData.device_token);
      }
    };

    updateDeviceToken();

    return () => {
      PushNotificationIOS.removeEventListener('register');
      PushNotificationIOS.removeEventListener('registrationError');
    };
  }, [user]);

  return deviceToken;
};
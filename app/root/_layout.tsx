import { Stack } from "expo-router";

const Layout = () => {

  return (
    <Stack>
      <Stack.Screen name="tabs" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="user-info" options={{ headerShown: false }} />
      <Stack.Screen name="new-post" options={{ headerShown: false }} />
      <Stack.Screen name="saved-post-gallery" options={{ headerShown: false }} />
      <Stack.Screen name="edit-post" options={{ headerShown: false }} />
      <Stack.Screen name="location" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="post" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="user-board" options={{ headerShown: false }} />
      <Stack.Screen name="new-personal-post" options={{ headerShown: false }} />
      
    </Stack>
  );
};

export default Layout;
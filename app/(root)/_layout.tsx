import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="user_info" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Layout;

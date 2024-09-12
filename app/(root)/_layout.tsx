import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="user-info" options={{ headerShown: false }} />
      <Stack.Screen name="country" options={{ headerShown: false }} />
      <Stack.Screen name="state" options={{ headerShown: false }} />
      <Stack.Screen name="city" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Layout;

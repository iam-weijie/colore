import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="friend-screen" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Layout;

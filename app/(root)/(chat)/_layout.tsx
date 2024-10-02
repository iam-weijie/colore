import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="new-conversation" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Layout;

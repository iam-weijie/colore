import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="nickname" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Layout;

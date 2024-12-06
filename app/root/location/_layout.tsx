import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="country" options={{ headerShown: false }} />
      <Stack.Screen name="state" options={{ headerShown: false }} />
      <Stack.Screen name="city" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Layout;

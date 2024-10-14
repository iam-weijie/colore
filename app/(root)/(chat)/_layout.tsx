import { Stack } from "expo-router";
import { ConversationProvider } from "@/components/ConversationContext";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="new-conversation" options={{ headerShown: false }} />
      <Stack.Screen name="conversation" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Layout;

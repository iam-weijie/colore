import '@/lib/cryptoPolyfill'; // Import crypto polyfill first

import { NavigationProvider } from "@/components/NavigationContext";
import { NotificationProvider } from '../notifications/NotificationContext';
import SplashVideo from "@/components/SplashVideo";
import { GlobalProvider } from "@/app/globalcontext";
import { AlertProvider } from "@/notifications/AlertContext";
import { tokenCache } from "@/lib/auth";
import { ClerkLoaded, ClerkProvider } from "@clerk/clerk-expo";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { LogBox, View } from "react-native";
import "react-native-reanimated";
import Animated, { FadeIn } from "react-native-reanimated";
import React from "react";
import { preloadCommonSounds } from '@/hooks/useSoundEffects';



// DEBUG: Log all imported components
console.log({
  NavigationProvider,
  NotificationProvider,
  SplashVideo,
  GlobalProvider,
  AlertProvider,
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs(["Clerk:"]);

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [isSplashVideoComplete, setSplashVideoComplete] = useState(false);

  const [loaded] = useFonts({
    "Jakarta-Bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "Jakarta-ExtraBold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "Jakarta-ExtraLight": require("../assets/fonts/PlusJakartaSans-ExtraLight.ttf"),
    "Jakarta-Light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
    "Jakarta-Medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "Jakarta-MediumItalic": require("../assets/fonts/PlusJakartaSans-MediumItalic.ttf"),
    "Jakarta": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "Jakarta-SemiBold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "Jakarta-SemiBoldItalic": require("../assets/fonts/PlusJakartaSans-SemiBoldItalic.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      preloadCommonSounds();
      setAppReady(true);
    }
  }, [loaded]);


  const showSplashVideo = !appReady || !isSplashVideoComplete;

  if (showSplashVideo) {
    return (
      <View className="flex-1 bg-white">
        <SplashVideo
          onAnimationFinish={(isCancelled) => {
            if (!isCancelled) {
              setSplashVideoComplete(true);
            }
          }}
        />
      </View>
    );
  }

  if (!publishableKey) {
    throw new Error(
      "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env"
    );
  }

  return (
    
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ClerkLoaded>
              <NavigationProvider>
         <GlobalProvider>
          <AlertProvider>
        <NotificationProvider>
          
            
              <Animated.View style={{ flex: 1 }} entering={FadeIn}>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false, animation: 'fade' }} />
                  <Stack.Screen name="auth" options={{ headerShown: false, animation: 'none' }} />
                  <Stack.Screen name="root" options={{ headerShown: false, animation: 'none' }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </Animated.View>
            
          </NotificationProvider>
          </AlertProvider>
          </GlobalProvider>
          </NavigationProvider>
        </ClerkLoaded>
      </ClerkProvider>
   
  );
}

import { ClerkLoaded, ClerkProvider } from "@clerk/clerk-expo";
import React from "react";
import MainContainer from "./navigation/MainContainer";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env"
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ClerkLoaded>
        <MainContainer />
      </ClerkLoaded>
    </ClerkProvider>
  );
}

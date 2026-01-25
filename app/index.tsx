
import React from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

const Home = () => {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) return <Redirect href="/auth/onboarding" />;

  return <Redirect href="/root/user-info" />;
};

export default Home;
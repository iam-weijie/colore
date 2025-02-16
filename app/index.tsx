import { useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";


const Home = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [isUpdating, setIsUpdating] = useState(true);

  if (!isSignedIn) return <Redirect href="/auth/sign-up" />;
  if (isUpdating) return null; // Prevent redirection until the API call finishes

  return <Redirect href="/root/user-info" />;
};

export default Home;

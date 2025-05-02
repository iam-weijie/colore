
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

const Home = () => {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) return <Redirect href="/auth/sign-up" />;

  return <Redirect href="/root/user-info" />;
};

export default Home;
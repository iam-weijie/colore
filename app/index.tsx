import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

const Home = () => {
  const { isSignedIn } = useAuth();

  if (isSignedIn) return <Redirect href="/root/user-info" />;

  return <Redirect href="/auth/sign-up" />;
};

export default Home;
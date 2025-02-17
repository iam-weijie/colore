import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { fetchAPI } from "@/lib/fetch";

const Home = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [isUpdating, setIsUpdating] = useState(true);

  useEffect(() => {
    const updateLastConnection = async () => {
      if (isSignedIn && user) {
        try {
          const response = await fetchAPI(`/api/users/updateUserLastConnection`,  {
            method: "PATCH",
            body: JSON.stringify({
              clerkId: user?.id,
            }),
          });

          if (response.error) {
            throw new Error(response.error);
          }
        } catch (error) {
          console.error("Failed to update user last connection:", error);
        } finally {
          setIsUpdating(false);
        }
      }
    };

    updateLastConnection();
  }, [isSignedIn, user]); // Runs only when `isSignedIn` or `user` changes

  if (!isSignedIn) return <Redirect href="/auth/sign-up" />;
  if (isUpdating) return null; // Prevent redirection until the API call finishes

  return <Redirect href="/root/user-info" />;
};

export default Home;

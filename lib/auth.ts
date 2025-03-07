import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { fetchAPI } from "./fetch";

export const tokenCache = {
  
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      return item;
    } catch (error) {
      console.error("SecureStore get item error: ", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error("SecureStore save item error: ", err);
    }
  },
};

export const googleOAuth = async (startOAuthFlow: any) => {
  try {
    const { createdSessionId, signUp, setActive } = await startOAuthFlow({
      redirectUrl: Linking.createURL("/root/tabs/home"),
    });

    if (createdSessionId) {
      if (setActive) {
        await setActive!({ session: createdSessionId });

        if (signUp.createdUserId) {
          await fetchAPI("/api/user/newUser", {
            method: "POST",
            body: JSON.stringify({
              email: signUp.emailAddress,
              clerkId: signUp.createdUserId
            }),
          });
        }

        return {
          success: true,
          code: "success",
          message: "You have successfully authenticated",
        };
      }
    }
    return {
      success: false,
      message: "An error occurred",
    };
  } catch (error: any) {
    return {
      success: false,
      code: error.code,
      message: error?.errors[0]?.longMessage,
    };
  }
};


export const appleOAuth = async (signUpResult: any, appleId: string) => {
  try {

    const { createdSessionId, createdUserId, emailAddress } = signUpResult;

    console.log("came here 4", createdSessionId, createdUserId, emailAddress )

    if (createdSessionId) {
      // Set the session as active
      await signUpResult.setActive({ session: createdSessionId });
      console.log("Came here 5", createdSessionId)

      if (createdUserId) {
        // Create new user in the database after successful sign-up
        console.log("Came here 6", createdUserId)
        const user = await fetchAPI("/api/user/newUser", {
          method: "POST",
          body: JSON.stringify({
            email: emailAddress || "", // The email received from the Apple OAuth
            clerkId: createdUserId, // Clerk ID after user creation
            appleId: appleId
          }),
        });

        console.log("User created in database:", user);
      }

      return {
        success: true,
        code: "success",
        message: "You have successfully authenticated with Apple",
      };
    }

    return {
      success: false,
      message: "An error occurred during the Apple OAuth process.",
    };
  } catch (error: any) {
    console.error("Apple OAuth Error:", error);
    return {
      success: false,
      code: error.code || "unknown_error",
      message: error?.errors?.[0]?.longMessage || "An unknown error occurred.",
    };
  }
};
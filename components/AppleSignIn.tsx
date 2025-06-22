import React, { useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useSignIn, useSignUp, useAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import CustomButton from "./CustomButton";

const AppleSignIn = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn, setActive } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();


  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken, email } = credential;
      console.log("🍏 Apple Credential received:", identityToken, email);

      if (!identityToken) {
        throw new Error("No identity token from Apple.");
      }

      let signInAttempt;

      try {
        signInAttempt = await signIn.create({
          strategy: "oauth_apple",
          token: identityToken,
          redirectUrl: "https://clerk.colore.ca/v1/oauth_callback",
        });
      } catch (err: any) {
        const clerkErrorCode = err?.errors?.[0]?.code;
        console.error("🔴 Clerk SignIn Error:", clerkErrorCode);

        if (clerkErrorCode === "authorization_invalid") {
          console.error("🚨 Detected invalid Apple OAuth setup.");
          setError("Problem verifying Apple sign-in. Please contact support.");
          return;
        } else if (clerkErrorCode === "identifier_not_found") {
          console.log("🆕 No user found, attempting sign-up...");

          signInAttempt = await signUp.create({
            strategy: "oauth_apple",
            token: identityToken,
            redirectUrl: "https://clerk.colore.ca/v1/oauth_callback",
          });
        } else {
          console.error("⚠️ Unexpected Clerk error:", err);
          setError("Unexpected error occurred. Please try again later.");
          return;
        }
      }

      console.log("🔍 SignIn/SignUp Attempt Result:", signInAttempt);

      if (signInAttempt.status === "complete" && signInAttempt.createdSessionId) {
        console.log("✅ Session created immediately!");
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/root/user-info");
        return;
      }

      if (signInAttempt.status === "needs_identifier") {
        console.warn("🟡 Additional Apple verification required.");

        const externalUrl = signInAttempt.firstFactorVerification.externalVerificationRedirectURL;

        if (!externalUrl) {
          console.error("⚠️ Missing external verification URL.");
          setError("Cannot continue Apple sign-in. Please try again.");
          return;
        }

        console.log("🌐 Opening Apple re-authorization page...");
        const result = await WebBrowser.openBrowserAsync(externalUrl.toString());

        if (result.type === "cancel" || result.type === "dismiss") {
          console.warn("⚠️ User cancelled Apple re-authorization.");
          setError("Sign-in cancelled. Please try again.");
          return;
        }

        console.log("✅ External verification flow complete. Checking Clerk session...");

        // Wait a moment for Clerk to finish creating session
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (isSignedIn) {
          console.log("✅ User signed in after external Apple verification.");
          router.replace("/root/user-info");
        } else {
          console.warn("⚠️ User still not signed in after external verification.");
          setError("Failed to complete Apple sign-in. Please try again.");
        }
        return;
      }

      console.error("⚠️ Unhandled sign-in state:", signInAttempt.status);
      setError("Sign-in could not be completed. Please try again.");

    } catch (error: any) {
      console.error("Apple Sign-In Fatal Error:", error);
      if (error.code === "ERR_CANCELED") {
        setError("You cancelled the Apple Sign-In.");
      } else {
        setError("An unexpected error occurred during Apple Sign-In.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <View className="w-full flex items-center justify-center my-4">
      {!loading ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={50}
          style={{ width: "50%", height: 65 }}
          onPress={handleAppleSignIn}
        />
      ) : (
        <View className="w-[50%] rounded-full p-6 bg-black">
          <ActivityIndicator size="small" color="#888888" />
        </View>
      )}
      {error && (
        <Text style={{ color: "red", marginTop: 5, textAlign: "center" }}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default AppleSignIn;

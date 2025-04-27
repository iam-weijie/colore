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
    setLoading(true); // ← You forgot to set loading true at the start!
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
  
      const { identityToken, email } = credential;

      console.log("🍏 Apple Sign-In Credentia", email)
      if (!identityToken) {
        throw new Error("No identity token returned from Apple.");
      }
  
      let signInAttempt;
      try {
        signInAttempt = await signIn.create({
          strategy: "oauth_apple",
          token: identityToken,
          redirectUrl: "com.colore://root/user-info",
        });
      } catch (err: any) {
        if (err.errors?.[0]?.code === "identifier_not_found") {
          console.log("🆕 No user found. Attempting sign-up...");
          signInAttempt = await signUp.create({
            strategy: "oauth_apple",
            token: identityToken,
            redirectUrl: "com.colore://root/user-info",
          });
        } else {
          throw err;
        }
      }
  
      console.log("🔍 SignIn/SignUp Attempt Result:", signInAttempt);
  
      if (signInAttempt.status === "complete" && signInAttempt.createdSessionId) {
        console.log("✅ Session created immediately!");
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/root/user-info");
      
      } else if (signInAttempt.status === "needs_identifier") {
        console.warn("🟡 Needs additional info (Apple external verification required)");
      
        const redirectUrl = "https://clerk.colore.ca/v1/oauth_callback";
        const externalUrl = signInAttempt.firstFactorVerification.externalVerificationRedirectURL;

        console.log("🔗 Opening external URL:", externalUrl);

      
        if (!externalUrl) {
          console.error("⚠️ No external verification URL found.");
          setError("Sign-in cannot continue. Please try again later.");
          return;
        }
      
        console.log("🌐 Opening Apple re-authorization page...");
        const result = await WebBrowser.openAuthSessionAsync(externalUrl.toString(), redirectUrl.toString());
        ;
      
        if (result.type === "cancel" || result.type === "dismiss") {
          console.warn("⚠️ User canceled external Apple sign-in.");
          setError("Sign-in was canceled. Please try again.");
          return;
        }
      
        console.log("✅ External Apple verification complete (user will be redirected automatically after).");
        
        // After user finishes, Clerk will handle the session (or you may want to manually re-check if session is created)
      
      } else {
        console.error("⚠️ Unexpected Apple Sign-In state:", signInAttempt.status);
        setError("Sign-in could not be completed. Please try again.");
      }
    } catch (error: any) {
      console.error("Apple Sign-In Error:", error);
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

import React, { useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router"; // Router to navigate after success
import { useSignUp, useSignIn } from "@clerk/clerk-expo";  // Use Clerk's hook
import { tokenCache } from "@/lib/auth";  // Assuming tokenCache is imported here
import { fetchAPI } from "@/lib/fetch"; // Custom fetch utility

const AppleSignIn = () => {

  const [loading, setLoading] = useState(false);   // Track loading state
  const [error, setError] = useState(null);   
  const { signUp, setActive } = useSignUp();       // Track errors
  const { signIn } = useSignIn();

  // Handle Apple Sign-In
  const handleAppleSignIn = async () => {
    setLoading(true);  // Show loading indicator
    setError(null);    // Reset any previous errors

    try {
      // Perform Apple Sign-In
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL, // Only email scope
        ],
      });

      if (credential) {
        const { identityToken, email, user } = credential;

        if (!email) {
          console.warn("Email is hidden; attempting authentication via identityToken.");
        }

        // Send identityToken and user ID to backend for verification and user creation
        const response = await fetchAPI(`/api/users/verifyAppleToken`, {
          method: "POST",
          body: JSON.stringify({
            identityToken, // Verify identity
          }),
        });

        if (response.success) {
          // Save the token securely using tokenCache
          await tokenCache.saveToken("appleToken", identityToken);
           // Use the Apple user ID (sub) as the identifier
           
           if (response.userInfo) {
             // If the user already exists, sign them in
             //console.log("user-info", response.userInfo)
             const result = await signIn.create({
              identifier: response.userInfo.clerk_id,
              strategy: "oauth_apple",
              token: identityToken,
            });

            if (result.status === "complete") {
              await setActive({ session: result.createdSessionId });
              router.push("/root/user-info");
            } else {
              setError("Failed to sign in.");
            }
           } else {
            // If the user doesn't exist, sign them up
            const result = await signUp.create({
              identifier: user,
              strategy: "oauth_apple",
              emailAddress: email || undefined,
              token: identityToken,
            });

            if (result.status === "complete") {
              await setActive({ session: result.createdSessionId });
              router.push("/root/user-info");
            } else {
              setError("Failed to sign up.");
            }
           }

          // Navigate to the user info page
          router.push("/root/user-info");
        } else {
          setError("Failed to authenticate or create a user.");
        }
      }
    } catch (error) {
      console.error("Apple Sign-In Error:", error);
      setError("An error occurred during sign-in.");
    } finally {
      setLoading(false);  // Hide loading indicator
    }
  };

  return (
    <View style={{ alignItems: "center", justifyContent: "center", marginTop: 50 }}>
      {/* Apple Authentication Button */}
      {!loading ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={50}
          className="w-full p-8 -mt-8"
          onPress={handleAppleSignIn}  // Handle sign-in on press
        />
      ) : (
        <View className="w-full rounded-full p-6 -mt-8 bg-black">
          <ActivityIndicator size={8} color="#ffffff" />
        </View>
      )}

      {/* Error message */}
      {error && <Text style={{ color: "red", marginTop: 5 }}>{error}</Text>}
    </View>
  );
};

export default AppleSignIn;

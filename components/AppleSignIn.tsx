import React, { useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router"; // Router to navigate after success
import { useSignUp, useSignIn, useUser} from "@clerk/clerk-expo"; // Use Clerk's hook
import { tokenCache, appleOAuth } from "@/lib/auth"; // Import appleOAuth for redirection
import { fetchAPI } from "@/lib/fetch"; // Custom fetch utility

const AppleSignIn = () => {
  const [loading, setLoading] = useState(false); // Track loading state
  const [error, setError] = useState(null); // Track errors
  const { signUp, setActive } = useSignUp(); // Sign up and set active session
  const { signIn } = useSignIn(); // Sign in
  const { user } = useUser();
  const router = useRouter(); // Router for navigation

const userInfo = user
  // Handle Apple callback using the authorization code (or identity token if needed)
  // After successful sign-in, pass the token to your backend (or Clerk)
const handleAppleCallback = async (identityToken) => {
  try {
    // Send identityToken to your backend for verification
    const response = await fetchAPI('/api/users/verifyAppleToken', {
      method: 'POST',
      body: JSON.stringify({
        identityToken: identityToken
      })
    });

    
    if (response.success) {
      console.log("sucess!")
      
      await handleSignUpOrSignIn(response.existingUser, identityToken, response.email, response.user); 
     
      // Proceed to the next step
    } else {
      setError('Failed to verify Apple token.');
    }
  } catch (error) {
    console.error('Token verification error:', error);
    setError('Error while verifying token.');
  }
};

const handleSignUpOrSignIn = async (existingUser, identityToken, email, appleId) => {

  console.log("Came here")
  if (existingUser) {
    console.log("Came here 2")
    // Sign in the existing user
    const logInAttempt = await signIn?.create({
      identifier: email
    });

    console.log("login attempt", logInAttempt)

    if (logInAttempt?.status === "complete") {

      await setActive({ session: logInAttempt.createdSessionId });
      router.replace("/root/tabs/home")
    } else {
      console.error(
        "Incomplete login:",
        JSON.stringify(logInAttempt, null, 2)
      );
    }
  
  } else {
    console.log("Came here 3")
    // Sign up the new user
    const user = await signUp?.create({
      strategy: "oauth_apple", // Using Apple strategy
      emailAddress: email, // Your redirect URL
      token: identityToken,
      redirectUrl:  "com.colore://root/user-info"
    });


    console.log("result", user)

    setActive({ session: user?.createdSessionId })

    await appleOAuth(user, appleId)
    router.push("/root/user-info")
   
  }
};


  // Handle Apple Sign-In when the user clicks the sign-in button
  const handleAppleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });

      if (credential) {
        const { identityToken, email, user } = credential;
        await handleAppleCallback(identityToken, email, user); // Proceed to next step with these details
      }
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      setError('An error occurred during sign-in.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={{ alignItems: "center", justifyContent: "center", marginTop: 50 }}>
      {!loading ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={50}
          className="w-full p-8 -mt-8"
          onPress={handleAppleSignIn}
        />
      ) : (
        <View className="w-full rounded-full p-6 -mt-8 bg-black">
         <ActivityIndicator size="small" color="#d1d1d1" />
        </View>
      )}

      {error && <Text style={{ color: "red", marginTop: 5 }}>{error}</Text>}
    </View>
  );
};

export default AppleSignIn;

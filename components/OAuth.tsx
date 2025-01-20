import { icons } from "@/constants";
import { googleOAuth } from "@/lib/auth";
import { useOAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useCallback } from "react";
import { Image, Text, View } from "react-native";
import CustomButton from "./CustomButton";

const OAuth = () => {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const handleGoogleLogIn = useCallback(async () => {
    try {
      console.log('Starting Google OAuth flow...');
      
      // Log the startOAuthFlow function to see its structure
      console.log('OAuth flow details:', JSON.stringify(startOAuthFlow, null, 2));
      
      // Wrap the OAuth call in a try-catch to catch pre-redirect errors
      try {
        const { createdSessionId, setActive, signIn, signUp } = await startOAuthFlow();
        console.log('Initial OAuth response:', {
          createdSessionId,
          setActive: !!setActive,
          signIn: !!signIn,
          signUp: !!signUp
        });
      } catch (oauthError) {
        console.error('Pre-redirect OAuth error:', {
          message: oauthError.message,
          stack: oauthError.stack,
          // Log additional error properties that might contain the redirect URL
          ...oauthError
        });
        throw oauthError;
      }

      const result = await googleOAuth(startOAuthFlow);
      console.log('OAuth result:', {
        code: result.code,
        fullResult: JSON.stringify(result, null, 2)
      });

      if (result.code === "session_exists" || result.code === "success") {
        console.log('OAuth successful, redirecting to user-info');
        router.push("/root/user-info");
      }
    } catch (err) {
      console.error('OAuth error:', {
        message: err.message,
        stack: err.stack,
        // Log any additional error properties
        errorDetails: JSON.stringify(err, null, 2)
      });
    }
  }, [startOAuthFlow]);

  return (
    <View>
      <View className="flex flex-row justify-center items-center mt-4 gap-x-3">
        <View className="flex-1 h-[1px] bg-general-100" />
        <Text className="font-JakartaBold color-[#898f91]">Or</Text>
        <View className="flex-1 h-[1px] bg-general-100" />
      </View>
      <CustomButton
        title="Google"
        className="mt-5 w-full shadow-none"
        IconLeft={() => (
          <Image
            source={icons.google}
            resizeMode="contain"
            className="w-5 h-5 mr-3"
          />
        )}
        bgVariant="outline"
        textVariant="primary"
        padding="3"
        onPress={handleGoogleLogIn}
      />
    </View>
  );
};

export default OAuth;
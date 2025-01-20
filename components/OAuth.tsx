import { icons } from "@/constants";
import { googleOAuth } from "@/lib/auth";
import { useOAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Text, View } from "react-native";
import CustomButton from "./CustomButton";

const OAuth = () => {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [error, setError] = useState("");

  const handleGoogleLogIn = useCallback(async () => {
    try {
      setError(""); // Clear any previous errors
      
      try {
        const { createdSessionId, setActive, signIn, signUp } = await startOAuthFlow();
        console.log('Initial OAuth response received');
      } catch (oauthError) {
        setError(JSON.stringify(oauthError, null, 2));
        return;
      }

      const result = await googleOAuth(startOAuthFlow);
      console.log('Google OAuth response received:', result);
      console.log('Google OAuth response code:', result.code);      
      if (result.code === "session_exists" || result.code === "success" || result.message === 'You\'re currently in single session mode. You can only be signed into one account at a time.') {

        router.push("/root/user-info");
      }
    } catch (err) {
      setError(JSON.stringify(err, null, 2));
    }
  }, [startOAuthFlow]);

  return (
    <View>
      <View className="flex flex-row justify-center items-center mt-4 gap-x-3">
        <View className="flex-1 h-[1px] bg-general-100" />
        <Text className="font-JakartaBold color-[#898f91]">Or</Text>
        <View className="flex-1 h-[1px] bg-general-100" />
      </View>
      
      {error && (
        <View className="mt-4 p-4 bg-red-100 rounded-lg">
          <Text className="text-red-600 font-medium">Error Details:</Text>
          <Text className="text-red-500 mt-2">{error}</Text>
        </View>
      )}

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
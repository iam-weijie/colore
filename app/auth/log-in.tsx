import { deriveKey, generateSalt } from "@/lib/encryption";
import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import AppleSignIn from "@/components/AppleSignIn";
import { Platform } from "react-native";
import { icons, images } from "@/constants";
import { useAuth, useSignIn, useUser } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useCallback, useState, useEffect, useRef } from "react";
import { Alert, Image, ScrollView, Text, View, ActivityIndicator } from "react-native";
import { useGlobalContext } from "@/app/globalcontext";
import React from "react";
import { fetchAPI } from "@/lib/fetch";
import { useAlert } from "@/notifications/AlertContext";
import { encryptionCache } from "@/cache/encryptionCache";

const LogIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signOut, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const { isIpad, setEncryptionKey } = useGlobalContext();
  const { showAlert } = useAlert()

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // Function to clear encryption key from storage
  const clearEncryptionKey = async () => {
    try {
      await AsyncStorage.removeItem(ENCRYPTION_KEY_STORAGE);
      console.log("[DEBUG] Login - Cleared encryption key from storage");
    } catch (error) {
      console.error("[DEBUG] Login - Error clearing encryption key:", error);
    }
  };

  // Check for existing session on component mount
  useEffect(() => {
    const checkExistingSession = async () => {
      if (!isLoaded) return;
      
      try {
        setLoginState(LOGIN_STATES.CHECKING_SESSION);
        setIsLoading(true);
        
        // Clear any stored login state
        await AsyncStorage.removeItem(LOGIN_STATE_KEY);
        
        if (isSignedIn) {
          console.log("[DEBUG] Login - Found existing session, signing out");
          await clearEncryptionKey();
          await signOut();
          console.log("[DEBUG] Login - Successfully signed out existing session");
          // Wait for signout to complete
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.log("[DEBUG] Login - Error during session check:", error);
      } finally {
        setIsLoading(false);
        setLoginState(LOGIN_STATES.READY);
      }
    };

    checkExistingSession();
  }, [isLoaded, isSignedIn, signOut]);

  const onLogInPress = useCallback(async () => {
    if (!isLoaded || loginState !== LOGIN_STATES.READY) {
      return;
    }

    setIsLoading(true);
    setLoginState(LOGIN_STATES.LOGGING_IN);

    try {

      let userId;
      let userSalt;
      let userExist;
      let needToCreateSalt;
      // Fetch user's salt first using email
      console.log("[DEBUG] Login - Fetching salt for:", form.email);
      const saltResponse = await fetchAPI(`/api/users/getSalt?email=${encodeURIComponent(form.email)}`);
      if (saltResponse.error) {
        showAlert({
        title: "Error",
        message: "Unable to retrieve security parameters.",
        type: "ERROR",
        status: "error"
      })
      }

      console.log("[Log-in]: ", saltResponse)

       userId = saltResponse.userId;
       userSalt = saltResponse.salt as string;
       userExist = saltResponse.email as string;
       needToCreateSalt = !userSalt && userExist

      if (needToCreateSalt) {
        userSalt = generateSalt()
      }

      console.log("[Log-in]", userSalt)

      const logInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });


      if (logInAttempt.status === "complete") {
        await setActive({ session: logInAttempt.createdSessionId });

        // Derive and store encryption key
        const key = deriveKey(form.password, userSalt);
        console.log("[DEBUG] Login - Derived key:", Boolean(key));
        console.log("[DEBUG] Login - Key starts with:", key.substring(0, 5) + "...");
        
        setEncryptionKey(key);
        await encryptionCache.setDerivedKey(key);

        if (needToCreateSalt) {
        try {
         await fetchAPI('/api/users/updateUserInfo', {
          method: 'PATCH',
          body: JSON.stringify({
            clerkId: userId,
            salt: userSalt
          })
        })
           router.replace("/root/user-info");
      } catch (error) {
        console.error("Failed to create user's salt", error)
      }
    }
   
  }

      
    } catch (err: any) {
      console.error("Raw login error:", err);

      if (err.errors?.[0]?.code === "session_exists") {
         showAlert({
        title: "Error",
        message:  "There seems to be an existing session. Please close the app completely and try again.",
        type: "ERROR",
        status: "error"
      })
      } else {
         showAlert({
        title: "Error",
        message:  (err as any).errors?.[0]?.longMessage || "An error occurred during login",
        type: "ERROR",
        status: "error"
      })
      }
    }
  }, [isLoaded, form, signIn, setActive, router, signOut, setEncryptionKey, user]);

  return (
    <View 
    className="flex-1 bg-white">
      <View className="relative w-full">
          <Image
            source={images.login}
            style={{
              position: "absolute",
              top: isIpad ? -150 : -90,
              right:0,
              width: "100%",
              height: undefined,
              aspectRatio: 1.5,
            }}
            resizeMode="cover"
          />
        </View>
      <View className="flex-1 "
      style={{
        paddingHorizontal: isIpad ? "12.5%" : 0
      }}>
      
        
        <View 
        className="relative bg-white rounded-[32px] "
        style={{
          padding: isIpad ? 40 : 20,
          marginTop: isIpad ? 150 : 180
        }}
        >
        <View>
           <Text 
           className="font-JakartaBold relative ml-5"
           style={{
            fontSize: isIpad ? 32 : 24
           }}
           >
            Welcome 👋
          </Text>
          </View>
          <View className="w-full p-5">
          <InputField
            label="Email"
            placeholder="Enter your email"
            icon={icons.email}
            textContentType="emailAddress"
            keyboardType="email-address"
            autoComplete="email"
            value={form.email}
            onChangeText={(value) => setForm({ ...form, email: value })}
            editable={!isLoading}
          />
          <InputField
            label="Password"
            placeholder="Enter your password"
            icon={icons.lock}
            value={form.password}
            secureTextEntry={true}
            textContentType="password"
            onChangeText={(value) => setForm({ ...form, password: value })}
            editable={!isLoading}
          />
          </View>
          <View className="flex items-center w-full">
            {isLoading ? (
              <View className="w-[50%] h-16 mt-8 items-center justify-center">
                <ActivityIndicator size="large" color="#6366f1" />
                <Text className="mt-2 text-sm text-general-200">
                  {loginState === LOGIN_STATES.LOGGING_IN ? "Logging in..." : 
                   loginState === LOGIN_STATES.PROCESSING_SALT ? "Setting up encryption..." : 
                   "Please wait..."}
                </Text>
              </View>
            ) : (
              <CustomButton
                className="w-[50%] h-16 mt-8 rounded-full shadow-none"
                fontSize="lg"
                title="Log In"
                padding={4}
                onPress={onLogInPress}
                bgVariant='gradient'
                disabled={isLoading || loginState !== LOGIN_STATES.READY}
              />
            )}
          </View>

          {/*Platform.OS === "android" && <OAuth />*/}
          {Platform.OS === "ios" && <AppleSignIn />}

          <Text className="text-base text-center text-general-200 mt-5">
            Don't have an account?{" "}
            <Link href="/auth/sign-up">
              <Text className="text-primary-500">Sign Up</Text>
            </Link>
          </Text>

          <Text className="text-base text-center text-general-200 mt-6">
            <Link href="/auth/reset">Forgot your password?</Link>
          </Text>
        </View>
      </View>
    </View>
  );
};

export default LogIn;


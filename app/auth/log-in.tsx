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
import { deriveKey, generateSalt } from "@/lib/encryption";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "@/notifications/AlertContext";
import { encryptionCache } from "@/cache/encryptionCache";

const ENCRYPTION_KEY_STORAGE = "encryptionKey";
const LOGIN_STATE_KEY = "login_state";

// Login states
const LOGIN_STATES = {
  INITIAL: "initial",
  CHECKING_SESSION: "checking_session",
  READY: "ready",
  LOGGING_IN: "logging_in",
  PROCESSING_SALT: "processing_salt",
  COMPLETE: "complete",
  ERROR: "error"
};

const LogIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signOut, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const { isIpad, setEncryptionKey } = useGlobalContext();
  const { showAlert } = useAlert();
  const [isLoading, setIsLoading] = useState(false);
  const [loginState, setLoginState] = useState(LOGIN_STATES.INITIAL);
  const processingSalt = useRef(false);

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
    const checkAndClearExistingSession = async () => {
      // This should only run once when the component is ready.
      if (!isLoaded) return;
      
      try {
        setLoginState(LOGIN_STATES.CHECKING_SESSION);
        setIsLoading(true);
        
        if (isSignedIn) {
          console.log("[DEBUG] Login - Found existing session on mount, signing out for a clean slate.");
          await clearEncryptionKey();
          await signOut();
        }
      } catch (error) {
        console.log("[DEBUG] Login - Error during session check:", error);
      } finally {
        setIsLoading(false);
        setLoginState(LOGIN_STATES.READY);
      }
    };

    checkAndClearExistingSession();
    // We want this to run only once when the component mounts and clerk is ready.
    // Removing `isSignedIn` from the dependency array prevents it from re-running after a successful login.
  }, [isLoaded, signOut]);

  const onLogInPress = useCallback(async () => {
    if (!isLoaded || loginState !== LOGIN_STATES.READY) {
      return;
    }

    setIsLoading(true);
    setLoginState(LOGIN_STATES.LOGGING_IN);

    try {
      // Fetch user's salt first using email
      let saltResponse = await fetchAPI(`/api/users/getSalt?email=${encodeURIComponent(form.email)}`);
      if (saltResponse.error) {
        showAlert({
          title: "Error",
          message: "Unable to retrieve security parameters.",
          type: "ERROR",
          status: "error"
        });
        setIsLoading(false);
        setLoginState(LOGIN_STATES.ERROR);
        return;
      }

      console.log("[Log-in]: ", saltResponse);

      let userId = saltResponse.userId;
      let userSalt = saltResponse.salt as string;
      let userExist = saltResponse.email as string;
      let needToCreateSalt = !userSalt && userExist;

      if (needToCreateSalt) {
        userSalt = generateSalt();
        console.log("[Log-in] Generated new salt");
      }

      // Now try to sign in with Clerk
      console.log("[DEBUG] Login - Attempting to sign in with:", form.email);
      const logInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      if (logInAttempt.status === "complete") {
        await setActive({ session: logInAttempt.createdSessionId });

        // Derive and store encryption key
        const key = deriveKey(form.password, userSalt);
        setEncryptionKey(key);
        await encryptionCache.setDerivedKey(key);

        // Store login state to resume if needed
        await AsyncStorage.setItem(LOGIN_STATE_KEY, JSON.stringify({
          email: form.email,
          password: form.password
        }));

        if (needToCreateSalt) {
          try {
            await fetchAPI('/api/users/updateUserInfo', {
              method: 'PATCH',
              body: JSON.stringify({
                clerkId: userId,
                salt: userSalt
              })
            });
            console.log("[DEBUG] Login - Updated user with new salt");
          } catch (error) {
            console.error("Failed to create user's salt", error);
            showAlert({
              title: "Warning",
              message: "Login successful, but encryption setup may be incomplete.",
              type: "WARNING",
              status: "warning"
            });
          }
        }

        router.replace("/root/user-info");
      } else {
        console.error(
          "Incomplete login:",
          JSON.stringify(logInAttempt, null, 2)
        );
        showAlert({
          title: "Error",
          message: "Login failed. Please try again.",
          type: "ERROR",
          status: "error"
        });
        setLoginState(LOGIN_STATES.ERROR);
      }
    } catch (err: any) {
      console.error("Raw login error:", err);

      if (err.errors?.[0]?.code === "session_exists") {
        showAlert({
          title: "Error",
          message: "There seems to be an existing session. Please close the app completely and try again.",
          type: "ERROR",
          status: "error"
        });
      } else {
        showAlert({
          title: "Error",
          message: (err as any).errors?.[0]?.longMessage || "An error occurred during login",
          type: "ERROR",
          status: "error"
        });
      }
    } finally {
      setIsLoading(false);
      setLoginState(LOGIN_STATES.READY);
    }
  }, [isLoaded, form, signIn, setActive, loginState, isUserLoaded, showAlert]);

  // Show loading screen during initial check
  if (loginState === LOGIN_STATES.INITIAL || loginState === LOGIN_STATES.CHECKING_SESSION) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-general-200">Preparing login...</Text>
      </View>
    );
  }

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
                bgVariant="gradient"
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


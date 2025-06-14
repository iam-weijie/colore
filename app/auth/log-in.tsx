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
  const { isIpad } = useGlobalContext();
  const { setEncryptionKey } = useGlobalContext();
  const [isLoading, setIsLoading] = useState(false);
  const [loginState, setLoginState] = useState(LOGIN_STATES.INITIAL);
  const [errorMessage, setErrorMessage] = useState("");
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
      // Now try to sign in with Clerk
      console.log("[DEBUG] Login - Attempting to sign in with:", form.email);
      const logInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      if (logInAttempt.status !== "complete") {
        console.error(
          "Incomplete login:",
          JSON.stringify(logInAttempt, null, 2)
        );
        setErrorMessage("Login failed. Please try again.");
        setLoginState(LOGIN_STATES.ERROR);
        setIsLoading(false);
        return;
      }

      console.log("[DEBUG] Login - Sign in successful, activating session");
      await setActive({ session: logInAttempt.createdSessionId });
      
      // Store login state to resume if needed
      await AsyncStorage.setItem(LOGIN_STATE_KEY, JSON.stringify({
        email: form.email,
        password: form.password
      }));

      // Wait a bit for user to be available after sign in
      let attempts = 0;
      while (!isUserLoaded && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
        attempts++;
      }
      
      // Process salt and encryption after successful login
      await processSaltAndEncryption();
      
    } catch (err: any) {
      console.error("Login error:", JSON.stringify(err, null, 2));

      if (err.errors?.[0]?.code === "session_exists") {
        setErrorMessage("There seems to be an existing session. Please try again after we reset it.");
        
        try {
          await signOut();
          console.log("[DEBUG] Login - Signed out after session_exists error");
          // Wait a moment before allowing another login attempt
          await new Promise(resolve => setTimeout(resolve, 1500));
          setLoginState(LOGIN_STATES.READY);
        } catch (signOutErr) {
          console.error("[DEBUG] Login - Error signing out after session_exists:", signOutErr);
          setLoginState(LOGIN_STATES.ERROR);
        }
      } else {
        setErrorMessage((err as any).errors?.[0]?.longMessage || "An error occurred during login");
        setLoginState(LOGIN_STATES.ERROR);
      }
      
      setIsLoading(false);
    }
  }, [isLoaded, form, signIn, setActive, loginState, isUserLoaded]);

  const processSaltAndEncryption = async () => {
    if (processingSalt.current) return;
    processingSalt.current = true;
    
    try {
      setLoginState(LOGIN_STATES.PROCESSING_SALT);
      
      // Now fetch user's salt
      console.log("[DEBUG] Login - Fetching salt for:", form.email);
      
      // Try several times to fetch the salt, as there might be race conditions
      let saltResponse = null;
      let saltFetchAttempts = 0;
      const maxSaltFetchAttempts = 5;
      
      while (saltFetchAttempts < maxSaltFetchAttempts) {
        try {
          saltFetchAttempts++;
          console.log(`[DEBUG] Login - Salt fetch attempt ${saltFetchAttempts}`);
          saltResponse = await fetchAPI(`/api/users/getSalt?email=${encodeURIComponent(form.email)}`);
          
          if (saltResponse) {
            console.log("[DEBUG] Login - Salt fetch successful");
            break;
          }
        } catch (saltFetchError) {
          console.error(`[DEBUG] Login - Salt fetch attempt ${saltFetchAttempts} failed:`, saltFetchError);
          
          if (saltFetchAttempts >= maxSaltFetchAttempts) {
            throw new Error(`Failed to fetch salt after ${maxSaltFetchAttempts} attempts`);
          }
          
          // Wait a moment before retrying
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
      
      if (!saltResponse) {
        throw new Error("Failed to fetch salt from server");
      }
      
      let userSalt = saltResponse.salt;
      
      // If salt doesn't exist, generate one and update the user record
      if (!userSalt) {
        console.log("[DEBUG] Login - No salt found, generating new salt");
        
        // Try to generate salt with retry logic
        let saltGenerationAttempts = 0;
        const maxAttempts = 3;
        
        while (saltGenerationAttempts < maxAttempts) {
          try {
            saltGenerationAttempts++;
            console.log(`[DEBUG] Login - Salt generation attempt ${saltGenerationAttempts}`);
            userSalt = generateSalt();
            
            if (userSalt) {
              console.log("[DEBUG] Login - Salt generated successfully");
              break;
            }
          } catch (saltError) {
            console.error(`[DEBUG] Login - Salt generation attempt ${saltGenerationAttempts} failed:`, saltError);
            
            if (saltGenerationAttempts >= maxAttempts) {
              throw new Error(`Failed to generate salt after ${maxAttempts} attempts`);
            }
            
            // Wait a moment before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        // Use either the user object from the API response or wait for the user context
        let userId = saltResponse.clerk_id || user?.id;
        let userApiResponse = null;
        
        if (!userId) {
          // Try to get user info via API if context isn't available
          try {
            userApiResponse = await fetchAPI(`/api/users/getUserByEmail?email=${encodeURIComponent(form.email)}`);
            if (userApiResponse && userApiResponse.clerk_id) {
              console.log("[DEBUG] Login - Retrieved user via API:", userApiResponse.clerk_id);
              userId = userApiResponse.clerk_id;
            }
          } catch (userApiError) {
            console.error("[DEBUG] Login - Failed to get user via API:", userApiError);
          }
          
          if (!userId) {
            console.warn("[DEBUG] Login - User ID not available, proceeding without updating salt");
            setErrorMessage("Login successful, but encryption setup failed. Please try logging out and back in.");
            setLoginState(LOGIN_STATES.ERROR);
            setIsLoading(false);
            processingSalt.current = false;
            return;
          }
        }
        
        // Update the user with the new salt
        try {
          const updateResponse = await fetchAPI("/api/users/updateSalt", {
            method: "PATCH",
            body: JSON.stringify({
              email: form.email,
              clerkId: userId,
              salt: userSalt,
            }),
          });
          
          console.log("[DEBUG] Login - Salt update result:", updateResponse.success);
          
          if (!updateResponse.success) {
            console.error("[DEBUG] Login - Failed to update salt:", updateResponse);
            setErrorMessage("Login successful, but encryption setup failed. Some features may be limited.");
            setLoginState(LOGIN_STATES.ERROR);
            setIsLoading(false);
            processingSalt.current = false;
            return;
          }
        } catch (saltError) {
          console.error("[DEBUG] Login - Error updating salt:", saltError);
          setErrorMessage("Login successful, but encryption setup failed. Some features may be limited.");
          setLoginState(LOGIN_STATES.ERROR);
          setIsLoading(false);
          processingSalt.current = false;
          return;
        }
      }
      
      console.log("[DEBUG] Login - Using salt:", Boolean(userSalt));
      
      // Derive and store encryption key with retry logic
      let key = null;
      let keyDerivationAttempts = 0;
      const maxKeyAttempts = 3;
      
      while (keyDerivationAttempts < maxKeyAttempts) {
        try {
          keyDerivationAttempts++;
          console.log(`[DEBUG] Login - Key derivation attempt ${keyDerivationAttempts}`);
          key = deriveKey(form.password, userSalt);
          
          if (key) {
            console.log("[DEBUG] Login - Key derived successfully");
            break;
          }
        } catch (keyError) {
          console.error(`[DEBUG] Login - Key derivation attempt ${keyDerivationAttempts} failed:`, keyError);
          
          if (keyDerivationAttempts >= maxKeyAttempts) {
            throw new Error(`Failed to derive key after ${maxKeyAttempts} attempts`);
          }
          
          // Wait a moment before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (!key) {
        throw new Error("Failed to derive encryption key");
      }
      
      console.log("[DEBUG] Login - Derived key:", Boolean(key));
      console.log("[DEBUG] Login - Key starts with:", key.substring(0, 5) + "...");
      
      setEncryptionKey(key);
      console.log("[DEBUG] Login - Encryption key set in context");

      // Clear login state since we're done
      await AsyncStorage.removeItem(LOGIN_STATE_KEY);
      
      setLoginState(LOGIN_STATES.COMPLETE);
      router.replace("/root/user-info");
      
    } catch (error) {
      console.error("[DEBUG] Login - Error in processSaltAndEncryption:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setErrorMessage(`Login successful, but there was an error setting up encryption: ${errorMessage}. Please try logging out and back in.`);
      setLoginState(LOGIN_STATES.ERROR);
      setIsLoading(false);
    } finally {
      processingSalt.current = false;
    }
  };

  // Handle error state
  useEffect(() => {
    if (loginState === LOGIN_STATES.ERROR && errorMessage) {
      Alert.alert("Error", errorMessage, [
        { 
          text: "OK", 
          onPress: () => {
            setErrorMessage("");
            setLoginState(LOGIN_STATES.READY);
          }
        }
      ]);
    }
  }, [loginState, errorMessage]);

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


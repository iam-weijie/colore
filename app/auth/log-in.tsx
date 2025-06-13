import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import AppleSignIn from "@/components/AppleSignIn";
import { Platform } from "react-native";
import { icons, images } from "@/constants";
import { useAuth, useSignIn, useUser } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import { useGlobalContext } from "@/app/globalcontext";
import React from "react";
import { fetchAPI } from "@/lib/fetch";
import { deriveKey, generateSalt } from "@/lib/encryption";

const LogIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { isIpad } = useGlobalContext();
  const { setEncryptionKey } = useGlobalContext();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onLogInPress = useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    try {
      // First try to sign in with Clerk to verify credentials
      const logInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      if (logInAttempt.status !== "complete") {
        console.error(
          "Incomplete login:",
          JSON.stringify(logInAttempt, null, 2)
        );
        Alert.alert("Error", "Log in failed. Please try again.");
        return;
      }

      await setActive({ session: logInAttempt.createdSessionId });
      
      // Wait briefly for the user object to be available
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!user || !user.id) {
        console.error("[DEBUG] Login - User object not available");
        Alert.alert("Warning", "Login successful, but user data is not available. Some features may be limited.");
      }
      
      const userId = user?.id;

      // Now fetch user's salt
      console.log("[DEBUG] Login - Fetching salt for:", form.email);
      const saltResponse = await fetchAPI(`/api/users/getSalt?email=${encodeURIComponent(form.email)}`);
      
      let userSalt;
      
      // If salt doesn't exist, generate one and update the user record
      if (!saltResponse.salt) {
        console.log("[DEBUG] Login - No salt found, generating new salt");
        userSalt = generateSalt();
        
        // Update the user with the new salt
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
          Alert.alert("Warning", "Login successful, but encryption setup failed. Some features may be limited.");
        }
      } else {
        userSalt = saltResponse.salt;
      }
      
      console.log("[DEBUG] Login - Using salt:", Boolean(userSalt));
      
      // Derive and store encryption key
      const key = deriveKey(form.password, userSalt);
      console.log("[DEBUG] Login - Derived key:", Boolean(key));
      console.log("[DEBUG] Login - Key starts with:", key.substring(0, 5) + "...");
      
      setEncryptionKey(key);
      console.log("[DEBUG] Login - Encryption key set in context");

      router.replace("/root/user-info");
    } catch (err: any) {
      console.error("Login error:", JSON.stringify(err, null, 2));

      if (err.errors?.[0]?.code === "session_exists") {
        Alert.alert(
          "Error",
          "There seems to be an existing session. Please close the app completely and try again.",
          [
            {
              text: "OK",
              style: "default",
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          (err as any).errors?.[0]?.longMessage || "An error occurred during login"
        );
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
          />
          <InputField
            label="Password"
            placeholder="Enter your password"
            icon={icons.lock}
            value={form.password}
            secureTextEntry={true}
            textContentType="password"
            onChangeText={(value) => setForm({ ...form, password: value })}
          />
          </View>
          <View className="flex items-center w-full">
                      <CustomButton
                        className="w-[50%] h-16 mt-8 rounded-full shadow-none"
                        fontSize="lg"
                        title="Log In"
                        padding={4}
                        onPress={onLogInPress}
                        bgVariant='gradient'
                      />
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

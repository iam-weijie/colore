import { deriveKey, generateSalt } from "@/lib/encryption";
import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import AppleSignIn from "@/components/AppleSignIn";
import { Platform } from "react-native";
import { icons, images } from "@/constants";
import { useAuth, useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import { useGlobalContext } from "@/app/globalcontext";
import React from "react";
import { fetchAPI } from "@/lib/fetch";
import { useAlert } from "@/notifications/AlertContext";
import { encryptionCache } from "@/cache/encryptionCache";

const LogIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signOut } = useAuth();
  const router = useRouter();
  const { isIpad, setEncryptionKey } = useGlobalContext();
  const { showAlert } = useAlert()

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onLogInPress = useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    try {

      let userId;
      let userSalt;
      let userExist;
      let needToCreateSalt;
      // Fetch user's salt first using email
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

      } catch (error) {
        console.error("Failed to create user's salt", error)
      }
    }

        router.replace("/root/user-info");
      } else {
        console.error(
          "Incomplete login:",
          JSON.stringify(logInAttempt, null, 2)
        );
        Alert.alert("Error", "Log in failed. Please try again.");
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
  }, [isLoaded, form, signIn, setActive, router, signOut, setEncryptionKey]);

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

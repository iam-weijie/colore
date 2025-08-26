import React, { useCallback, useState, useRef } from "react";
import { Platform, Text, View, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth, useSignIn, useUser } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { deriveKey, generateSalt } from "@/lib/encryption";
import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import AppleSignIn from "@/components/AppleSignIn";
import { icons } from "@/constants"; // keeping icons for InputField
import { useDevice } from "@/app/contexts/DeviceContext";
import { useEncryptionContext } from "@/app/contexts/EncryptionContext";
import { fetchAPI } from "@/lib/fetch";
import { useAlert } from "@/notifications/AlertContext";
import { encryptionCache } from "@/cache/encryptionCache";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";

/** ------------------- Component ------------------- **/

const LogIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signOut, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const { isIpad } = useDevice();
  const { setEncryptionKey } = useEncryptionContext();
  const { showAlert } = useAlert();
  const [isLoading, setIsLoading] = useState(false);
  const processingSalt = useRef(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  /** --------- IDENTICAL LOGIC (unchanged) --------- **/
  const onLogInPress = useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    setIsLoading(true);

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
          status: "error",
        });
      }

      console.log("[Log-in]: ", saltResponse);

      userId = saltResponse.userId;
      userSalt = saltResponse.salt as string;
      userExist = saltResponse.email as string;
      needToCreateSalt = !userSalt && userExist;

      if (needToCreateSalt) {
        userSalt = generateSalt();
      }

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
            await fetchAPI("/api/users/updateUserInfo", {
              method: "PATCH",
              body: JSON.stringify({
                clerkId: userId,
                salt: userSalt,
              }),
            });
          } catch (error) {
            console.error("Failed to create user's salt", error);
          }
        }

        router.replace("/root/user-info");
      }
    } catch (err: any) {
      console.error("Raw login error:", err);
      console.error("Raw login error:", err);

      if (err.errors?.[0]?.code === "session_exists") {
        showAlert({
          title: "Error",
          message:
            "There seems to be an existing session. Please close the app completely and try again.",
          type: "ERROR",
          status: "error",
        });
      } else {
        showAlert({
          title: "Error",
          message: (err as any).errors?.[0]?.longMessage || "An error occurred during login",
          type: "ERROR",
          status: "error",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, form, signIn, setActive, router, signOut, setEncryptionKey, user]);
  /** --------- END IDENTICAL LOGIC --------- **/

  /** ------------------- UI ------------------- **/
  return (
    <View className="flex-1">
      {/* Brand multi-stop gradient background (keeps existing palette; feel free to tweak) */}
      <LinearGradient
        colors={["#7AA5FF", "#E07AFF", "#FFD36E"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ ...StyleSheet.absoluteFillObject }}
      />

      {/* Volumetric radial glows (subtle depth) */}
      <Svg pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="glowTopLeft" cx="18%" cy="12%" r="45%">
            <Stop offset="0" stopColor="#7AA5FF" stopOpacity={0.5} />
            <Stop offset="1" stopColor="#7AA5FF" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glowBottomRight" cx="85%" cy="85%" r="40%">
            <Stop offset="0" stopColor="#FFD36E" stopOpacity={0.4} />
            <Stop offset="1" stopColor="#FFD36E" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glowTopLeft)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glowBottomRight)" />
      </Svg>

      {/* “Cork board” texture hint via tiny confetti specks */}
      <View pointerEvents="none" className="absolute inset-0">
        <View className="absolute top-6 left-8 w-1 h-1 rounded-full bg-white/40" />
        <View className="absolute top-20 right-10 w-1.5 h-1.5 rounded-full bg-white/35" />
        <View className="absolute bottom-28 left-16 w-1 h-1 rounded-full bg-white/30" />
        <View className="absolute bottom-16 right-12 w-1.5 h-1.5 rounded-full bg-white/25" />
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 w-full"
        contentContainerStyle={[
          { minHeight: '100%', justifyContent: 'flex-end' },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View
          className="relative w-full  self-center bg-white border border-white/20 rounded-[48px] p-12"
          style={{
            height: "70%"
          }}
        >

          {/* Title */}
          <Text
            className="font-JakartaBold text-black"
            style={{ fontSize: isIpad ? 36 : 28, marginLeft: 6, marginBottom: 10 }}
          >
            Welcome 👋
          </Text>

          {/* Fields */}
          <View className="w-full mt-2">
          <InputField
              label="Email"
              placeholder="Enter your email"
              icon={icons.email}
              textContentType="emailAddress"    // For iOS
              keyboardType="email-address"
              autoComplete="email"              // Add this for web/Android
              autoCapitalize="none"
              name="email"                      // Add this for better autofill recognition
              value={form.email}
              onChangeText={(value) => setForm({ ...form, email: value })}
              editable={!isLoading}
              className="bg-white/10 border-white/20"
              inputClassName="text-white placeholder:text-white/70"
              labelClassName="text-white/80"
            />

            <InputField
              label="Password"
              placeholder="Enter your password"
              icon={icons.lock}
              value={form.password}
              secureTextEntry={true}
              textContentType="password"
              autoComplete="password"
              onChangeText={(value) => setForm({ ...form, password: value })}
              editable={!isLoading}
              labelClassName="text-white/80"
            />
          </View>

          {/* CTA */}
          <View className="items-center w-full mt-6">
            {isLoading ? (
              <View className="w-[60%] h-16 mt-6 items-center justify-center">
                <ColoreActivityIndicator />
              </View>
            ) : (
              <CustomButton
                className="w-[60%] h-16 mt-8 rounded-full shadow-none"
                fontSize="lg"
                title="Log In"
                padding={4}
                onPress={onLogInPress}
                bgVariant="gradient" // reusing your gradient button
                disabled={isLoading}
              />
            )}
          </View>

          {/* Optional OAuth (kept as-is, still commented) */}
          {/* {Platform.OS === "android" && <OAuth />} */}
          {/* {Platform.OS === "ios" && <AppleSignIn />} */}

          {/* Links */}
          <Text className="text-base text-center text-black/80 mt-6">
            Don't have an account?{" "}
            <Link href="/auth/sign-up">
              <Text className="text-black underline">Sign Up</Text>
            </Link>
          </Text>

          <Text className="text-base text-center text-black/80 mt-4">
            <Link href="/auth/reset">Forgot your password?</Link>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

import { StyleSheet } from "react-native";
export default LogIn;

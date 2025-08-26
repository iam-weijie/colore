import { useSignUp } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Keyboard, ScrollView, Text, TouchableWithoutFeedback, View, ActivityIndicator, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInUp,
  SlideInRight,
  BounceIn,
  ZoomIn,
} from "react-native-reanimated";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import AppleSignIn from "@/components/AppleSignIn";
import { Platform } from "react-native";
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { useDevice } from "@/app/contexts/DeviceContext";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { generateSalt, deriveKey } from "@/lib/encryption";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEncryptionContext } from "@/app/contexts/EncryptionContext";

const ENCRYPTION_KEY_STORAGE = "encryptionKey";

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [error, setError] = useState("");
  const { isIpad } = useDevice();
  const { setEncryptionKey } = useEncryptionContext();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [verification, setVerification] = useState({
    error: "",
    code: "",
  });

  const handleConfirmPassword = (value: string) => {
    if (form.password !== value) {
      setError("* Passwords do not match");
    } else {
      setError("");
    }
  };

  /** ----------------------- LOGIC UNCHANGED ----------------------- **/
  const onSignUpPress = async () => {
    if (!isLoaded || error) {
      return;
    }

    setIsLoading(true);

    try {
      console.log("[DEBUG] SignUp - Creating account with email:", form.email);
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setShowVerification(true);
    } catch (err: any) {
      console.error("[DEBUG] SignUp - Error creating account:", err);
      Alert.alert("Error", err.errors?.[0]?.longMessage || "An error occurred during sign up");
    } finally {
      setIsLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) {
      return;
    }

    setIsLoading(true);

    try {
      console.log("[DEBUG] SignUp - Attempting verification with code");
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });

      if (completeSignUp.status === "complete") {
        console.log("[DEBUG] SignUp - Verification complete, userId:", completeSignUp.createdUserId);

        // Generate per-user salt and encryption key with retries
        let salt = null;
        let saltGenerationAttempts = 0;
        const maxAttempts = 3;

        while (saltGenerationAttempts < maxAttempts) {
          try {
            saltGenerationAttempts++;
            console.log(`[DEBUG] SignUp - Salt generation attempt ${saltGenerationAttempts}`);
            salt = generateSalt();

            if (salt) {
              console.log("[DEBUG] SignUp - Salt generated successfully");
              break;
            }
          } catch (saltError) {
            console.error(`[DEBUG] SignUp - Salt generation attempt ${saltGenerationAttempts} failed:`, saltError);

            if (saltGenerationAttempts >= maxAttempts) {
              throw new Error(`Failed to generate salt after ${maxAttempts} attempts`);
            }

            // Wait a moment before retrying
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        if (!salt) {
          throw new Error("Could not generate security key (salt)");
        }

        console.log("[DEBUG] SignUp - Creating user in database");
        try {
          const newUserResponse = await fetchAPI("/api/users/newUser", {
            method: "POST",
            body: JSON.stringify({
              email: form.email,
              clerkId: completeSignUp.createdUserId,
              salt,
            }),
          });

          console.log("[DEBUG] SignUp - User created in database:", newUserResponse.success);

          if (!newUserResponse.success) {
            console.error("[DEBUG] SignUp - Failed to create user in database:", newUserResponse);
          }
        } catch (dbError) {
          console.error("[DEBUG] SignUp - Error creating user in database:", dbError);
          // Continue despite database error - we can fix this later
        }

        // Derive encryption key client-side and keep in memory only
        console.log("[DEBUG] SignUp - Deriving encryption key");

        let key = null;
        let keyDerivationAttempts = 0;
        const maxKeyAttempts = 3;

        while (keyDerivationAttempts < maxKeyAttempts) {
          try {
            keyDerivationAttempts++;
            console.log(`[DEBUG] SignUp - Key derivation attempt ${keyDerivationAttempts}`);
            key = deriveKey(form.password, salt);

            if (key) {
              console.log("[DEBUG] SignUp - Key derived successfully");
              break;
            }
          } catch (keyError) {
            console.error(`[DEBUG] SignUp - Key derivation attempt ${keyDerivationAttempts} failed:`, keyError);

            if (keyDerivationAttempts >= maxKeyAttempts) {
              throw new Error(`Failed to derive key after ${maxKeyAttempts} attempts`);
            }

            // Wait a moment before retrying
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        if (!key) {
          throw new Error("Failed to set up encryption");
        }

        // Save encryption key to AsyncStorage
        try {
          await AsyncStorage.setItem(ENCRYPTION_KEY_STORAGE, key);
          console.log("[DEBUG] SignUp - Encryption key saved to storage");
        } catch (storageError) {
          console.error("[DEBUG] SignUp - Failed to save encryption key to storage:", storageError);
          // Continue despite storage error
        }

        setEncryptionKey(key);
        console.log("[DEBUG] SignUp - Encryption key set in context");

        console.log("[DEBUG] SignUp - Setting active session");
        await setActive({ session: completeSignUp.createdSessionId });
        setShowSuccess(true);
      } else {
        console.log("[DEBUG] SignUp - Verification incomplete:", completeSignUp.status);
        setVerification({
          ...verification,
          error: "Verification failed. Please try again.",
        });
      }
    } catch (err: any) {
      console.error("[DEBUG] SignUp - Error during verification:", err);
      setVerification({
        ...verification,
        error: err.errors?.[0]?.longMessage || "An error occurred during verification",
      });
    } finally {
      setIsLoading(false);
    }
  };
  /** --------------------- END LOGIC (UNCHANGED) ------------------- **/

  /** ------------------- SUCCESS VIEW (new style) ------------------ **/
  if (showSuccess) {
    return (
      <View className="flex-1">
        {/* Brand background */}
        <LinearGradient
          colors={["#7AA5FF", "#E07AFF", "#FFD36E"]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Svg pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <RadialGradient id="s1" cx="18%" cy="12%" r="45%">
              <Stop offset="0" stopColor="#7AA5FF" stopOpacity={0.5} />
              <Stop offset="1" stopColor="#7AA5FF" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="s2" cx="85%" cy="85%" r="40%">
              <Stop offset="0" stopColor="#FFD36E" stopOpacity={0.4} />
              <Stop offset="1" stopColor="#FFD36E" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#s1)" />
          <Rect width="100%" height="100%" fill="url(#s2)" />
        </Svg>

        <Animated.View
          entering={ZoomIn.duration(600).springify()}
          className="flex-1 justify-center items-center px-7"
          style={{ paddingHorizontal: isIpad ? "15%" : 0 }}
        >
          <View className="w-full max-w-[720px] bg-white rounded-[48px] p-10 items-center">
            <Animated.Image entering={BounceIn.duration(800)} source={icons.check} className="w-[110px] h-[110px] mb-5" />
            <Animated.Text entering={FadeInDown.duration(600).delay(200)} className="text-3xl font-JakartaBold text-center text-black">
              Verified
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.duration(600).delay(300)}
              className="text-base text-black/60 font-Jakarta text-center mt-2 mb-5"
            >
              You have been successfully verified.
            </Animated.Text>
            <Animated.View entering={FadeInUp.delay(400).duration(600)} className="w-full">
              <CustomButton title="Continue" onPress={() => router.push("/root/user-info")} className="w-full" padding={4} />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    );
  }

  /** ---------------- VERIFICATION VIEW (new style) ---------------- **/
  if (showVerification) {
    return (
      <View className="flex-1">
        <LinearGradient
          colors={["#7AA5FF", "#E07AFF", "#FFD36E"]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Svg pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <RadialGradient id="v1" cx="18%" cy="12%" r="45%">
              <Stop offset="0" stopColor="#7AA5FF" stopOpacity={0.5} />
              <Stop offset="1" stopColor="#7AA5FF" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="v2" cx="85%" cy="85%" r="40%">
              <Stop offset="0" stopColor="#FFD36E" stopOpacity={0.4} />
              <Stop offset="1" stopColor="#FFD36E" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#v1)" />
          <Rect width="100%" height="100%" fill="url(#v2)" />
        </Svg>

        <Animated.View
          entering={SlideInRight.duration(600)}
          className="flex-1 px-7 justify-center"
          style={{ paddingHorizontal: isIpad ? "15%" : 0 }}
        >
          <View className="w-full max-w-[720px] self-center bg-white rounded-[48px] p-10">
            <Animated.Text entering={FadeInDown.duration(600)} className="text-2xl font-JakartaExtraBold mb-2 text-black">
              Verification
            </Animated.Text>
            <Animated.Text entering={FadeInDown.duration(600).delay(100)} className="font-Jakarta mb-5 text-black/70">
              We've sent a verification code to {form.email}
            </Animated.Text>

            <Animated.View entering={FadeInDown.duration(600).delay(200)}>
              <InputField
                label="Code"
                icon={icons.lock}
                placeholder="12345"
                value={verification.code}
                keyboardType="numeric"
                onChangeText={(code) => setVerification({ ...verification, code })}
                editable={!isLoading}
              />
            </Animated.View>

            {verification.error && (
              <Animated.Text entering={FadeIn.duration(300)} className="text-red-500 text-sm mt-1">
                {verification.error}
              </Animated.Text>
            )}

            <Animated.View entering={FadeInUp.duration(600).delay(300)}>
              {isLoading ? (
                <View className="mt-5 items-center justify-center h-14">
                  <ActivityIndicator size="large" />
                  <Text className="mt-2 text-sm text-black/60">Processing...</Text>
                </View>
              ) : (
                <CustomButton title="Verify Email" onPress={onPressVerify} className="mt-5" padding={4} />
              )}
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(600).delay(400)}>
              <CustomButton title="Back" onPress={() => setShowVerification(false)} className="mt-5" padding={4} disabled={isLoading} />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    );
  }

  /** --------------------- DEFAULT FORM (new style) ---------------- **/
  return (
    <View className="flex-1">
      {/* Brand multi-stop gradient (Coloré) */}
      <LinearGradient
        colors={["#7AA5FF", "#E07AFF", "#FFD36E"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Radial glows for depth */}
      <Svg pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="g1" cx="18%" cy="12%" r="45%">
            <Stop offset="0" stopColor="#7AA5FF" stopOpacity={0.5} />
            <Stop offset="1" stopColor="#7AA5FF" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="g2" cx="85%" cy="85%" r="40%">
            <Stop offset="0" stopColor="#FFD36E" stopOpacity={0.4} />
            <Stop offset="1" stopColor="#FFD36E" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#g1)" />
        <Rect width="100%" height="100%" fill="url(#g2)" />
      </Svg>

      {/* Subtle confetti specks */}
      <View pointerEvents="none" className="absolute inset-0">
        <View className="absolute top-6 left-8 w-1 h-1 rounded-full bg-white/40" />
        <View className="absolute top-20 right-10 w-1.5 h-1.5 rounded-full bg-white/35" />
        <View className="absolute bottom-28 left-16 w-1 h-1 rounded-full bg-white/30" />
        <View className="absolute bottom-16 right-12 w-1.5 h-1.5 rounded-full bg-white/25" />
      </View>

      <Animated.View entering={FadeIn.duration(400)} style={{ paddingHorizontal: isIpad ? "15%" : 0 }} className="flex-1">
        <ScrollView
          className="flex-1 w-full"
          contentContainerStyle={{ minHeight: "100%", justifyContent: "flex-end" }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="w-full self-center bg-white rounded-[48px] p-10" style={{ height: "70%", maxWidth: 720 }}>
              <Animated.Text
                entering={FadeInDown.duration(600)}
                className="font-JakartaBold text-black"
                style={{ fontSize: isIpad ? 32 : 26, marginBottom: 12 }}
              >
                Create your account
              </Animated.Text>

              <Animated.View entering={FadeInDown.duration(600).delay(200)}>
                <InputField
                  label="Email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChangeText={(text) => setForm({ ...form, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textContentType="emailAddress"
                  autoComplete="email"
                />
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(600).delay(300)}>
                <InputField
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry
                  value={form.password}
                  onChangeText={(text) => setForm({ ...form, password: text })}
                  textContentType="newPassword"
                  autoComplete="password"
                />
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(600).delay(400)}>
                <InputField
                  label="Confirm Password"
                  icon={icons.lock}
                  placeholder="Confirm password"
                  secureTextEntry
                  textContentType="newPassword"
                  onChangeText={handleConfirmPassword}
                  editable={!isLoading}
                />
              </Animated.View>

              {error ? (
                <Animated.Text entering={FadeIn.duration(300)} className="text-red-500 text-sm mt-1">
                  {error}
                </Animated.Text>
              ) : null}

              <View className="w-full items-center mt-6">
                {isLoading ? (
                  <View className="mt-8 items-center justify-center h-14">
                    <ActivityIndicator size="large" />
                    <Text className="mt-2 text-sm text-black/60">Creating account...</Text>
                  </View>
                ) : (
                  <CustomButton
                    title="Sign Up"
                    onPress={onSignUpPress}
                    className="mt-8 w-[60%] h-16 rounded-full"
                    padding={4}
                    disabled={!form.email || !form.password || !!error}
                  />
                )}
              </View>

              {/* {Platform.OS === "android" && <OAuth />} */}
              {/* {Platform.OS === "ios" && <AppleSignIn />} */}

              <Text className="text-base text-center text-black/80 mt-6">
                Already have an account?{" "}
                <Link href="/auth/log-in">
                  <Text className="text-black underline">Log In</Text>
                </Link>
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

export default SignUp;

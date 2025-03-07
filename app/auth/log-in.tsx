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

const LogIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signOut } = useAuth();
  const router = useRouter();
   const { isIpad } = useGlobalContext()

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onLogInPress = useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    try {
      // First try to sign out of any existing session
      try {
        await signOut();
      } catch (signOutError) {
        console.log("No active session to sign out from:", signOutError);
      }

      // Wait a brief moment for the signOut to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      const logInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      if (logInAttempt.status === "complete") {
        await setActive({ session: logInAttempt.createdSessionId });
        router.replace("/root/user-info");
      } else {
        console.error(
          "Incomplete login:",
          JSON.stringify(logInAttempt, null, 2)
        );
        Alert.alert("Error", "Log in failed. Please try again.");
      }
    } catch (err) {
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
          err.errors?.[0]?.longMessage || "An error occurred during login"
        );
      }
    }
  }, [isLoaded, form, signIn, setActive, router, signOut]);

  return (
    <ScrollView 
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
          <InputField
            label="Email"
            placeholder="Enter your email"
            icon={icons.email}
            textContentType="emailAddress"
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
          <CustomButton
            title="Log In"
            onPress={onLogInPress}
            padding="3"
            bgVariant="gradient"
            className="mt-8"
          />
          <Text className="text-base text-center text-general-200 mt-6">
            <Link href="/auth/reset">Forgot your password?</Link>
          </Text>

          {Platform.OS === "android" && <OAuth />}
          {Platform.OS === "ios" && <AppleSignIn />}

          <Text className="text-base text-center text-general-200 mt-5">
            Don't have an account?{" "}
            <Link href="/auth/sign-up">
              <Text className="text-primary-500">Sign Up</Text>
            </Link>
          </Text>

          <Text className="text-base text-center text-general-200 mt-3">
            By continuing, you agree to our{" "}
            <Link href="https://www.termsfeed.com/live/6e904e78-161a-46ce-b707-7dc6462d1422">
              <Text className="text-primary-500">Terms of Service</Text>
            </Link>{" "}
            and{" "}
            <Link href="https://www.termsfeed.com/live/83f5c527-834f-4373-88d0-4428498b6537">
              <Text className="text-primary-500">Privacy Policy</Text>
            </Link>
            .
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default LogIn;

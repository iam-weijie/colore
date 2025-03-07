import { useSignUp } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";

import Circle from "@/components/Circle";
import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import AppleSignIn from "@/components/AppleSignIn";
import { Platform } from "react-native";
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { useGlobalContext } from "@/app/globalcontext";

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [error, setError] = useState("");
  const { isIpad } = useGlobalContext()

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

  const onSignUpPress = async () => {
    if (!isLoaded || error) {
      return;
    }

    try {
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setShowVerification(true);
    } catch (err: any) {
      Alert.alert("Error", err.errors[0].longMessage);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });

      if (completeSignUp.status === "complete") {
        await fetchAPI("/api/users/newUser", {
          method: "POST",
          body: JSON.stringify({
            email: form.email,
            clerkId: completeSignUp.createdUserId,
          }),
        });

        await setActive({ session: completeSignUp.createdSessionId });
        setShowSuccess(true);
      } else {
        setVerification({
          ...verification,
          error: "Verification failed. Please try again.",
        });
      }
    } catch (err: any) {
      setVerification({
        ...verification,
        error: err.errors[0].longMessage,
      });
    }
  };

  if (showSuccess) {
    return (
      <View 
      className="flex-1 bg-white justify-center items-center px-7"
      style={{
        paddingHorizontal: isIpad ? "15%" : 0
      }}>
        <Image source={icons.check} className="w-[110px] h-[110px] mb-5" />

        <Text className="text-3xl font-JakartaBold text-center">Verified</Text>

        <Text className="text-base text-gray-400 font-Jakarta text-center mt-2 mb-5">
          You have been successfully verified.
        </Text>

        <CustomButton
          title="Continue"
          onPress={() => router.push("/root/user-info")}
          className="w-full"
          padding="3"
        />
      </View>
    );
  }

  if (showVerification) {
    return (
      <View 
      className="flex-1 bg-white px-7 justify-center"
      style={{
        paddingHorizontal: isIpad ? "15%" : 0
      }}>
        <Text className="text-2xl font-JakartaExtraBold mb-2">
          Verification
        </Text>

        <Text className="font-Jakarta mb-5">
          We've sent a verification code to {form.email}
        </Text>

        <InputField
          label="Code"
          icon={icons.lock}
          placeholder="12345"
          value={verification.code}
          keyboardType="numeric"
          onChangeText={(code) => setVerification({ ...verification, code })}
        />

        {verification.error && (
          <Text className="text-red-500 text-sm mt-1">
            {verification.error}
          </Text>
        )}

        <CustomButton
          title="Verify Email"
          onPress={onPressVerify}
          className="mt-5 bg-success-500"
          padding="3"
        />

        <CustomButton
          title="Back"
          onPress={() => setShowVerification(false)}
          className="mt-5"
          padding="3"
        />
      </View>
    );
  }

  return (
    <ScrollView 
    className="bg-white"
    style={{
      paddingHorizontal: isIpad ? "15%" : 0
    }}>
      <View className="relative">
        <Circle
          color="#ffd640"
          size={500}
          style={{
            position: "absolute",
            top: -350,
            right: -40,
            opacity: 0.7,
          }}
        />
        <Circle
          color="#ffa647"
          size={350}
          style={{
            position: "absolute",
            top: -220,
            right: -140,
            opacity: 0.5,
          }}
        />
      </View>

      <View className="relative w-full">
        <Text 
        className="font-JakartaBold relative ml-5 mt-[180]"
        style={{
          fontSize: isIpad ? 32 : 24
         }}>
          Create Your Account
        </Text>
      </View>

      <View className="p-5">
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

        <InputField
          label=""
          placeholder="Confirm your password"
          icon={icons.lock}
          secureTextEntry={true}
          textContentType="password"
          onChangeText={handleConfirmPassword}
          containerStyle="mt-[-30px]"
        />
        {error ? (
          <Text className="text-red-500 text-sm mt-1">{error}</Text>
        ) : null}

        <CustomButton
          title="Sign Up"
          onPress={onSignUpPress}
          padding="3"
          bgVariant="gradient"
          className="mt-8 bg-gradient-to-r from-yellow-400 to-orange-400"
        />

        {/*Platform.OS === "android" && <OAuth />*/}
        {/*Platform.OS === "ios" && <AppleSignIn />*/}

        <Text className="text-base text-center text-general-200 mt-5">
          Already have an account?{" "}
          <Link href="/auth/log-in">
            <Text className="text-primary-500">Log In</Text>
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
    </ScrollView>
  );
};

export default SignUp;

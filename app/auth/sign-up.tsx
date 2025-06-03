import { useSignUp } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Image, Keyboard, KeyboardAvoidingView, ScrollView, Text, TouchableWithoutFeedback, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInUp,
  SlideInRight,
  BounceIn,
  ZoomIn,
  Easing
} from 'react-native-reanimated';

import Circle from "@/components/Circle";
import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import AppleSignIn from "@/components/AppleSignIn";
import { Platform } from "react-native";
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { useGlobalContext } from "@/app/globalcontext";
import React from "react";
import { LinearGradient } from 'expo-linear-gradient';

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
      <Animated.View 
        entering={ZoomIn.duration(600).springify()}
        className="flex-1 bg-white justify-center items-center px-7"
        style={{
          paddingHorizontal: isIpad ? "15%" : 0
        }}
      >
        <Animated.Image 
          entering={BounceIn.duration(800)}
          source={icons.check} 
          className="w-[110px] h-[110px] mb-5" 
        />

        <Animated.Text 
          entering={FadeInDown.duration(600).delay(200)}
          className="text-3xl font-JakartaBold text-center"
        >
          Verified
        </Animated.Text>

        <Animated.Text 
          entering={FadeInDown.duration(600).delay(300)}
          className="text-base text-gray-400 font-Jakarta text-center mt-2 mb-5"
        >
          You have been successfully verified.
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <CustomButton
            title="Continue"
            onPress={() => router.push("/root/user-info")}
            className="w-full bg-indigo-500"
            padding="4"
          />
        </Animated.View>
      </Animated.View>
    );
  }

  if (showVerification) {
    return (
      <Animated.View 
        entering={SlideInRight.duration(600)}
        className="flex-1 bg-white px-7 justify-center"
        style={{
          paddingHorizontal: isIpad ? "15%" : 0
        }}
      >
        <Animated.Text 
          entering={FadeInDown.duration(600)}
          className="text-2xl font-JakartaExtraBold mb-2"
        >
          Verification
        </Animated.Text>

        <Animated.Text 
          entering={FadeInDown.duration(600).delay(100)}
          className="font-Jakarta mb-5"
        >
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
          />
        </Animated.View>

        {verification.error && (
          <Animated.Text 
            entering={FadeIn.duration(300)}
            className="text-red-500 text-sm mt-1"
          >
            {verification.error}
          </Animated.Text>
        )}

        <Animated.View entering={FadeInUp.duration(600).delay(300)}>
          <CustomButton
            title="Verify Email"
            onPress={onPressVerify}
            className="mt-5 bg-success-500 bg-indigo-500"
            padding="3"
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(400)}>
          <CustomButton
            title="Back"
            onPress={() => setShowVerification(false)}
            className="mt-5"
            padding="3"
          />
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      entering={FadeIn.duration(400)}
      className="flex-1 bg-white"
      style={{
        paddingHorizontal: isIpad ? "15%" : 0
      }}
    >
      <Animated.View entering={SlideInUp.duration(800)}>
        <LinearGradient
          colors={["#ffd12b", "#ff9f45"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="w-full items-start justify-center rounded-b-[48px] pt-16 pl-11 min-h-[18%] pb-6 mb-6"
        >   
          <Animated.Text 
            entering={FadeInDown.delay(200).duration(600)}
            className="text-white text-3xl font-JakartaBold"
          >
            Create
          </Animated.Text>
          <Animated.Text 
            entering={FadeInDown.delay(300).duration(600)}
            className="text-white text-xl font-JakartaMedium"
          >
            Your Account
          </Animated.Text>
        </LinearGradient>
      </Animated.View>
<TouchableWithoutFeedback className="flex-1"
onPress={() => {
  Keyboard.dismiss()
}}>
      <View className="flex-1 justify-between mb-12">
        <View className="flex-1 mx-6 justify-start p-5">
          <Animated.View entering={FadeInDown.duration(600).delay(400)}>
            <InputField
              label="Email"
              placeholder="Enter your email"
              autoComplete="email"
              icon={icons.email}
              textContentType="emailAddress"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(value) => setForm({ ...form, email: value })}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(500)}>
            <InputField
              label="Password"
              placeholder="Enter your password"
              icon={icons.lock}
              value={form.password}
              secureTextEntry={true}
              textContentType="password"
              onChangeText={(value) => setForm({ ...form, password: value })}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(600)}>
            <InputField
              label=""
              placeholder="Confirm your password"
              icon={icons.lock}
              secureTextEntry={true}
              textContentType="password"
              onChangeText={handleConfirmPassword}
              containerStyle="mt-[-30px]"
            />
          </Animated.View>

          {error && (
            <Animated.Text 
              entering={FadeIn.duration(300)}
              className="text-red-500 text-sm mt-1"
            >
              {error}
            </Animated.Text>
          )}
        </View>

        <Animated.View entering={FadeInUp.duration(600).delay(700)}>
          <View className="flex items-center w-full">
            <CustomButton
              className="w-[50%] h-16 mt-8 rounded-full shadow-none"
              fontSize="lg"
              title="Sign Up"
              padding="0"
              onPress={onSignUpPress}
              bgVariant='gradient'
            />
            {Platform.OS === "ios" && <AppleSignIn />}
          </View>
        </Animated.View>

        <Animated.Text 
          entering={FadeIn.duration(600).delay(800)}
          className="text-base text-center text-general-200 "
        >
          Already have an account?{" "}
          <Link href="/auth/log-in">
            <Text className="text-primary-500">Log In</Text>
          </Link>
        </Animated.Text>
      </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

export default SignUp;
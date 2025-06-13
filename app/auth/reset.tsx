import { useSignIn } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useState } from "react";
import { Image, KeyboardAvoidingView, ScrollView, Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { icons } from "@/constants";
import React from "react";
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useGlobalContext } from "@/app/globalcontext";

const PwReset = () => {
  const { signIn } = useSignIn();
  const { isIpad } = useGlobalContext()
  const [showVerification, setShowVerification] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

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

  // Request a password reset code by email
  const onRequestReset = async () => {
    try {
      await signIn!.create({
        strategy: "reset_password_email_code",
        identifier: form.email,
      });
      setShowVerification(true);
    } catch (err: any) {
      alert(err.errors[0].message);
    }
  };

  // Reset the password with the code and the new password
  const onReset = async () => {
    try {
      await signIn!.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: verification.code,
        password: form.password,
      });

      setShowSuccess(true);
    } catch (err: any) {
      alert(err.errors[0].message);
    }
  };

  if (showSuccess) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-7">
        <Image source={icons.check} className="w-[110px] h-[110px] mb-5" />

        <Text className="text-3xl font-JakartaBold text-center">Success</Text>

        <Text className="text-base text-gray-400 font-Jakarta text-center mt-2 mb-5">
          Password reset successfully.
        </Text>

        <CustomButton
          title="Start"
          onPress={() => router.push("/auth/log-in")}
          className="w-full"
          padding={3}
        />
      </View>
    );
  }

  if (showVerification) {
    return (
      <View className="flex-1 bg-white px-7 justify-center">
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

        <InputField
          label="Password"
          placeholder="Enter new password"
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

        {verification.error && (
          <Text className="text-red-500 text-sm mt-1">
            {verification.error}
          </Text>
        )}

        <CustomButton
          title="Reset Password"
          onPress={onReset}
          className="mt-5 bg-success-500"
          padding={3}
        />

        <CustomButton
          title="Back"
          onPress={() => setShowVerification(false)}
          className="mt-5"
          padding={3}
        />
      </View>
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
          className="w-full items-start justify-center rounded-b-[48px] pt-12 pl-8 pb-6 mb-6"
        >   
          <Animated.Text 
            entering={FadeInDown.delay(200).duration(600)}
            className="text-white text-3xl font-JakartaBold"
          >
            Reset
          </Animated.Text>
          <Animated.Text 
            entering={FadeInDown.delay(300).duration(600)}
            className="text-white text-xl font-JakartaSemiBold"
          >
            Your Password
          </Animated.Text>
        </LinearGradient>
      </Animated.View>
<KeyboardAvoidingView behavior="padding" className="flex-1">
      <View className="flex-1 justify-between mb-12">
        <View className="flex-1 mx-6 justify-start p-5">
          <Animated.View entering={FadeInDown.duration(600).delay(400)}>
          <InputField
            label="Email"
            placeholder="Enter your email"
            icon={icons.email}
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value) => setForm({ ...form, email: value })}
            style={{ height: 60 }}
          />
          </Animated.View>

        </View>

        <Animated.View entering={FadeInUp.duration(600).delay(700)}>
          <View className="flex items-center w-full">
            <CustomButton
              className="w-[50%] h-16 mt-8 rounded-full shadow-none"
              fontSize="lg"
              title="Continue"
             padding={4}
              onPress={onRequestReset}
              bgVariant='gradient'
            />
          </View>
        </Animated.View>
        </View>
        </KeyboardAvoidingView>


     
    </Animated.View>
  );
};

export default PwReset;

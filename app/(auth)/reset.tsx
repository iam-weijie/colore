import { useSignIn } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { icons } from "@/constants";

const PwReset = () => {
  const { signIn } = useSignIn();
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
        <Image
          source={icons.check}
          className="w-[110px] h-[110px] mb-5"
        />

        <Text className="text-3xl font-JakartaBold text-center">
          Success
        </Text>

        <Text className="text-base text-gray-400 font-Jakarta text-center mt-2 mb-5">
          Password reset successfully.
        </Text>

        <CustomButton
          title="Start"
          onPress={() => router.push("/(auth)/log-in")}
          className="w-full"
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
          containerStyle="mt-[-20px]"
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
        />

        <CustomButton
          title="Back"
          onPress={() => setShowVerification(false)}
          className="mt-3"
        />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
            Reset Your Password
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
            style={{ height: 60 }}
          />

          <CustomButton
            title="Continue"
            onPress={onRequestReset}
            className="mt-10"
            style={{ height: 60 }}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default PwReset;
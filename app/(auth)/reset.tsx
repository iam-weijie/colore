import { useSignIn } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ReactNativeModal } from "react-native-modal";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { icons } from "@/constants";

const PwReset = () => {
  const { signIn } = useSignIn();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [verification, setVerification] = useState({
    state: "default",
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
      setVerification({ ...verification, state: "pending" });
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

      setVerification({ ...verification, state: "success" });
    } catch (err: any) {
      alert(err.errors[0].message);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white ">
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

        <ReactNativeModal
          isVisible={verification.state === "pending"}
          onModalHide={() => {
            if (verification.state === "success") {
              setShowSuccessModal(true);
            }
          }}
        >
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <TouchableOpacity
              onPress={() =>
                setVerification({ ...verification, state: "default" })
              }
              className="absolute right-0 p-4"
            >
              <Image source={icons.close} className="w-5 h-5" />
            </TouchableOpacity>
            <Text className="text-2xl font-JakartaExtraBold mb-2">
              Verification
            </Text>
            <Text className=" font-Jakarta mb-5">
              We've sent a verification code to {form.email}
            </Text>

            <InputField
              label="Code"
              icon={icons.lock}
              placeholder="12345"
              value={verification.code}
              keyboardType="numeric"
              onChangeText={(code) =>
                setVerification({ ...verification, code })
              }
            />

            {verification.error && (
              <Text className="text-red-500 text-sm mt-1">
                {verification.error}
              </Text>
            )}

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

            <CustomButton
              title="Reset Password"
              onPress={onReset}
              className="mt-5 bg-success-500"
            />
          </View>
        </ReactNativeModal>

        <ReactNativeModal isVisible={showSuccessModal}>
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Image
              source={icons.check}
              className="w-[110px] h-[110px] mx-auto my-5"
            />

            <Text className="text-3xl font-JakartaBold text-center">
              Success
            </Text>

            <Text className="text-base text-gray-400 font-Jakarta text-center mt-2">
              Password reset successfully.
            </Text>

            <CustomButton
              title="Start"
              onPress={() => {
                setShowSuccessModal(false);
                router.push("/(root)/user-info");
              }}
              className="mt-5"
            />
          </View>
        </ReactNativeModal>
      </View>
    </ScrollView>
  );
};

export default PwReset;

import { useSignUp } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ReactNativeModal } from "react-native-modal";
import Circle from "@/components/Circle";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons, images } from "@/constants";
import { fetchAPI } from "@/lib/fetch";

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
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

      setVerification({ ...verification, state: "pending" });
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
        await fetchAPI("/(api)/(users)/newUser", {
          method: "POST",
          body: JSON.stringify({
            email: form.email,
            clerkId: completeSignUp.createdUserId,
          }),
        });

        await setActive({ session: completeSignUp.createdSessionId });
        setVerification({ ...verification, state: "success" });
      } else {
        setVerification({
          ...verification,
          state: "pending",
          error: "Verification failed. Please try again.",
        });
      }
    } catch (err: any) {
      setVerification({
        ...verification,
        state: "pending",
        error: err.errors[0].longMessage,
      });
    }
  };

  return (
    <ScrollView className="bg-white">
      <View className="relative overflow-hidden">
        <Circle
          color="#FFDB5C"
          size={300}
          style={{
            position: "relative",
            top: -100,  
            left: -30,
          }}
        />
        <Circle
          color="#FFD158"
          size={200}
          style={{
            position: "absolute",
            top: -50,
            right: -50,
          }}
        />
      </View>
      <View className="relative w-full">
        <Text className="text-2xl font-JakartaSemiBold absolute bottom-5 left-5">
          Welcome 👋
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
          containerStyle="mt-[-20px]"
        />
        {error ? (
          <Text className="text-red-500 text-sm mt-1">{error}</Text>
        ) : null}

        <CustomButton
          title="Sign Up"
          onPress={onSignUpPress}
          className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-400"
        />

        <OAuth />

        <Text className="text-base text-center text-general-200 mt-10">
          Already have an account?{" "}
          <Link href="/log-in">
            <Text className="text-primary-500">Log In</Text>
          </Link>
        </Text>
      </View>

    </ScrollView>
  );
};

export default SignUp;

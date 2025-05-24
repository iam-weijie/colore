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
import { TextLocalized } from "@/components/TextLocalized";
import { useTranslation } from 'react-i18next';

const LogIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signOut } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
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
           <TextLocalized 
           className="font-JakartaBold relative ml-5"
           style={{
            fontSize: isIpad ? 32 : 24
           }}
           >
            welcome
          </TextLocalized >
          </View>
          <View className="w-full p-5">
          <InputField
            label={`${t("email")}`}
            placeholder={t("enter.email")}
            icon={icons.email}
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value) => setForm({ ...form, email: value })}
          />
          <InputField
            label={`${t("password")}`}
            placeholder={t("enter.password")}
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
                        title={`${t("login")}`}
                        padding="0"
                        onPress={onLogInPress}
                        bgVariant='gradient'
                      />
                    </View>
       

          {/*Platform.OS === "android" && <OAuth />*/}
          {Platform.OS === "ios" && <AppleSignIn />}
 <View className="flex flex-row items-end gap-2 justify-center mt-5">
          <TextLocalized className="text-base text-center text-general-200">
            noaccount
          </TextLocalized>
              <Link href="/auth/sign-up">
              <TextLocalized className="text-base text-center text-primary-500">signup</TextLocalized>
            </Link>
            </View>
            
        <Link href="/auth/reset" className="mt-4">
          <TextLocalized className="text-base text-center text-general-200">forgotpassword</TextLocalized>
          </Link>
        </View>
      </View>
    </View>
  );
};

export default LogIn;

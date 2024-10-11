import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons, images } from "@/constants";
import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";

const LogIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  //const { isLoaded1, isSignedIn, session } = useSession();
  //console.log("isLoggedIn: ", isSignedIn);
  //console.log("isLoaded: ", isLoaded1);
  //console.log("session: ", session);
  //session?.end();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onLogInPress = useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    try {
      const logInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      if (logInAttempt.status === "complete") {
        await setActive({ session: logInAttempt.createdSessionId });
        router.replace("/(root)/user-info");
      } else {
        console.error(JSON.stringify(logInAttempt, null, 2));
        Alert.alert("Error", "Log in failed. Please try again.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Error", err.errors[0].longMessage);
    }
  }, [isLoaded, form, signIn, setActive, router]);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white ">
        <View className="relative w-full h-[250px]">
          <Image source={images.login} className="z-0 w-full h-[250px] " />
          <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
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

          <CustomButton
            title="Log In"
            onPress={onLogInPress}
            className="mt-6"
          />
          <Text className="text-base text-center text-general-200 mt-6">
            <Link href="/reset">Forgot your password?</Link>
          </Text>

          <OAuth />

          <Text className="text-base text-center text-general-200 mt-10">
            Don't have an account?{" "}
            <Link href="/sign-up">
              <Text className="text-primary-500">Sign Up</Text>
            </Link>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default LogIn;

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons, images } from "@/constants";
import { Link } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";

const LogIn = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onLogInPress = async () => {};

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
            className="mt-12"
          />

          <OAuth />

          <Text className="text-base text-center text-general-200 mt-10">
            Don't have an account?{" "}
            <Link href="/sign-up">
              <Text className="text-primary-500">Sign Up</Text>
            </Link>
          </Text>
        </View>

        {/*Verification modal*/}
      </View>
    </ScrollView>
  );
};

export default LogIn;

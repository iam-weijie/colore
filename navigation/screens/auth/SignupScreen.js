import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import CustomButton from "../../../components/CustomButton";
import InputField from "../../../components/InputField";
import { icons } from "../../../constants";

const SignupScreen = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const onSignUpPress = async () => {};

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white ">
        <View className="relative w-full h-[150px]">
          <Text className="text-2xl text-black font-semibold absolute bottom-5 left-5">
            Create Your Account
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Name"
            placeHolder="Enter your name"
            icon={icons.person}
            value={form.name}
            onChangeText={(value) =>
              setForm({ value: { ...form, name: value } })
            }
          />
          <InputField
            label="Email"
            placeHolder="Enter your email"
            icon={icons.email}
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value) =>
              setForm({ value: { ...form, email: value } })
            }
          />
          <InputField
            label="Password"
            placeHolder="Enter your password"
            icon={icons.lock}
            value={form.password}
            secureTextEntry={true}
            textContentType="password"
            onChangeText={(value) =>
              setForm({ value: { ...form, password: value } })
            }
          />

          <CustomButton
            title="Sign Up"
            onPress={onSignUpPress}
            className="mt-12"
          ></CustomButton>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignupScreen;

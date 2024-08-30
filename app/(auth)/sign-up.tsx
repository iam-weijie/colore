import { images } from "@/constants";
import { Image, ScrollView, Text, View } from "react-native";

const SignUp = () => {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white ">
        <View className="relative w-full h-[250px]">
          <Image
            source={images.signup}
            className="z-0 w-full h-[200px] "
          />
          <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
            Create Your Account
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignUp;

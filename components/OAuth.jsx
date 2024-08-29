import { Image, Text, View } from "react-native";
import { icons } from "../constants";
import CustomButton from "./CustomButton";

const OAuth = () => {
  const handleGoogleLogIn = async () => {};

  return (
    <View>
      <View className="flex flex-row justify-center items-center mt-4 gap-x-3">
        <View className="flex-1 h-[0.5px] bg-gray-500" />
        <Text className="text-lg mx-2">Or</Text>
        <View className="flex-1 h-[0.5px] bg-gray-500" />
      </View>

      <CustomButton
        title="Log In with Google"
        className="mt-5 w-full shadow-none"
        IconLeft={() => (
          <Image
            source={icons.google}
            resizeMode="contain"
            className="w-5 h-5 mx-2"
          />
        )}
        bgVariant="outline"
        textVariant="primary"
        onPress={handleGoogleLogIn}
      />
    </View>
  );
};

export default OAuth;

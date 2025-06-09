import React from 'react';
import { Text, Image, TouchableOpacity, ScrollView, View } from 'react-native';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp 
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { InfoScreenProps } from '@/types/type';
import CustomButton from './CustomButton';
import ColoreActivityIndicator from './ColoreActivityIndicator';

const InfoScreen: React.FC<InfoScreenProps> = ({
  title,
  subtitle,
  image,
  content,
  hasAction = true,
  onAgree,
}) => {
  return (
    <View className={`flex-1 ${hasAction ? 'bg-[#FAFAFA]' : 'bg-[#FFFFFF]'} p-6 items-center justify-center`}>
      {image ? (
        <Animated.View entering={FadeIn.duration(1000)}>
          <Image source={image} className="w-60 h-60 mb-6" resizeMode="contain" />
        </Animated.View>
      ) : (
        <ColoreActivityIndicator
        text='Loading...'
          size={40}
          />
      )}

      <Animated.View entering={FadeInDown.duration(800)}>
        <Text className="text-center text-[20px] font-bold mb-2">{title}</Text>
      </Animated.View>

      {subtitle && (
        <Animated.View entering={FadeInDown.delay(100).duration(800)}>
          <Text className="text-center text-[18px] font-semibold mb-4">{subtitle}</Text>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(200).duration(800)}>
        <Text className="text-center text-[16px] text-tray-700 leading-relaxed mb-10 mx-4">
          {content}
        </Text>
      </Animated.View>

      {hasAction && (
        <Animated.View entering={FadeInUp.delay(300).duration(800)}>
          <CustomButton
            className="w-[50%] h-16 rounded-full shadow-none bg-black mb-6"
            fontSize="lg"
            title="Explore"
            padding={4}
            onPress={() => {
              // Optional: Add button press animation
              onAgree();
            }}
          />
        </Animated.View>
      )}
    </View>
  );
};

export const TutorialScreen: React.FC<InfoScreenProps> = ({
  title,
  subtitle,
  image,
  content,
  hasAction = true,
  onAgree,
}) => {
  return (
    <View className="flex-1 items-center justify-center ">
      {image ? (
        <Animated.View entering={FadeIn.duration(1000)} className="mb-6">
          <Image
            source={image}
            className="w-36 h-36"
            resizeMode="contain"
          />
        </Animated.View>
      ) : (
        <ColoreActivityIndicator text="Loading..." size={40} />
      )}

      <Animated.View entering={FadeInDown.duration(800)} className="mb-3 px-2">
        <Text className="text-center text-[20px] font-JakartaSemiBold leading-snug">
          {title}
        </Text>
      </Animated.View>

      {subtitle && (
        <Animated.View entering={FadeInDown.delay(100).duration(800)} className="mb-3 px-2">
          <Text className="text-center text-[18px] font-JakartaMedium text-tray-700">
            {subtitle}
          </Text>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(200).duration(800)} className="px-3 mb-8">
        <Text className="text-center text-[16px] text-tray-600 leading-relaxed font-Jakarta">
          {content}
        </Text>
      </Animated.View>

      {hasAction && (
        <Animated.View entering={FadeInUp.delay(300).duration(800)} className="w-full items-center">
          <CustomButton
            className="w-[60%] h-14"
            fontSize="lg"
            title="Explore"
            padding={4}
            onPress={onAgree}
          />
        </Animated.View>
      )}
    </View>
  );
};


export default InfoScreen;
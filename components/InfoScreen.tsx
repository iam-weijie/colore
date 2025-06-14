import React, { useEffect } from 'react';
import { Text, Image, TouchableOpacity, ScrollView, View } from 'react-native';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing, 
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
  // Animation values
  const waveAnim = useSharedValue(0);
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    // Start both animations
    waveAnim.value = withRepeat(
      withTiming(1, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1,
      true
    );
    
    floatAnim.value = withRepeat(
      withTiming(1, {
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  // Wavy text component (unchanged)
  const WavyCharacter = ({ char, index }: { char: string; index: number }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const offset = interpolate(
        waveAnim.value,
        [0, 1],
        [0, Math.sin((index + waveAnim.value) * 0.5) * 8]
      );
      return {
        transform: [{ translateY: offset }],
      };
    });

    return (
      <Animated.Text
        style={[
          {
            fontSize: 36,
            fontWeight: 'bold',
          },
          animatedStyle,
        ]}
      >
        {char === ' ' ? '\u00A0' : char}
      </Animated.Text>
    );
  };

  // Floating image animation
const floatingStyle = useAnimatedStyle(() => {
  const translateY = interpolate(
    floatAnim.value,
    [0, 1],
    [-15, 15]
  );
  const translateX = interpolate(
    floatAnim.value,
    [0, 1],
    [-5, 5] // Slight horizontal movement
  );
  const rotate = interpolate(
    floatAnim.value,
    [0, 1],
    [-3, 3] // Slight rotation in degrees
  );
  return {
    transform: [
      { translateY },
      { translateX },
      { rotate: `${rotate}deg` },
    ],
  };
});

  return (
    <View className={`flex-1 ${hasAction ? 'bg-[#FAFAFA]' : 'bg-[#FFFFFF]'} p-6 items-center justify-center`}>
      {image ? (
        <Animated.View 
          entering={FadeIn.duration(1000)}
          style={floatingStyle}
        >
          <Image source={image} className="w-60 h-60 -mb-2" resizeMode="contain" />
        </Animated.View>
      ) : (
        <ColoreActivityIndicator
          text='Loading...'
          size={40}
        />
      )}

      {/* Rest of your component remains unchanged */}
      <Animated.View entering={FadeInDown.duration(800)}>
        <View className="mb-4" style={{ flexDirection: 'row', justifyContent: 'center' }}>
          {title.split('').map((char, index) => (
            <WavyCharacter key={index} char={char} index={index} />
          ))}
        </View>
      </Animated.View>

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
import React, { useEffect } from 'react';
import { Text, Image, View } from 'react-native';
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
  // Animations
  const waveAnim = useSharedValue(0);
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    waveAnim.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.linear }), -1, true);
    floatAnim.value = withRepeat(withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  // Wavy title characters
  const WavyCharacter = ({ char, index }: { char: string; index: number }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const offset = interpolate(waveAnim.value, [0, 1], [0, Math.sin((index + waveAnim.value) * 0.5) * 8]);
      return { transform: [{ translateY: offset }] };
    });

    return (
      <Animated.Text
        style={animatedStyle}
        className="text-[28px] leading-[40px] font-JakartaBold"
      >
        {char === ' ' ? '\u00A0' : char}
      </Animated.Text>
    );
  };

  // Floating image animation
  const floatingStyle = useAnimatedStyle(() => {
    const translateY = interpolate(floatAnim.value, [0, 1], [-15, 15]);
    const translateX = interpolate(floatAnim.value, [0, 1], [-5, 5]);
    const rotate = interpolate(floatAnim.value, [0, 1], [-3, 3]);
    return { transform: [{ translateY }, { translateX }, { rotate: `${rotate}deg` }] };
  });

  return (
    // Lock width to slide; avoid horizontal overflow
    <View className={`w-full flex-1 ${hasAction ? 'bg-[#FAFAFA]' : 'bg-[#FFFFFF]'} px-6 py-6 items-center justify-center`}>
      {image ? (
        <Animated.View entering={FadeIn.duration(1000)} style={floatingStyle}>
          <Image source={image} className="w-48 h-48 -mb-2" resizeMode="contain" />
        </Animated.View>
      ) : (
        <ColoreActivityIndicator text="Loading..." size={40} />
      )}

      {/* Title wraps within slide width */}
      <Animated.View entering={FadeInDown.duration(800)} className="flex-row flex-wrap justify-center items-end self-center max-w-[90%] mb-4">
        {title.split('').map((char, idx) => (
          <WavyCharacter key={`${char}-${idx}`} char={char} index={idx} />
        ))}
      </Animated.View>

      {/* Body text constrained */}
      <Animated.View entering={FadeInDown.delay(200).duration(800)} className="max-w-[92%] self-center mb-6 px-2">
        <Text className="text-center text-[16px] leading-relaxed text-tray-700">
          {content}
        </Text>
      </Animated.View>

      {hasAction && (
        <Animated.View entering={FadeInUp.delay(300).duration(800)} className="w-full items-center">
          <CustomButton
            className="w-[50%] h-16 rounded-full shadow-none bg-black mb-6"
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

export const TutorialScreen: React.FC<InfoScreenProps> = ({
  title,
  subtitle,
  image,
  content,
  hasAction = true,
  onAgree,
}) => {
  return (
    <View className="w-full flex-1 items-center justify-center px-6 py-6">
      {image ? (
        <Animated.View entering={FadeIn.duration(1000)} className="mb-6">
          <Image source={image} className="w-36 h-36" resizeMode="contain" />
        </Animated.View>
      ) : (
        <ColoreActivityIndicator text="Loading..." size={40} />
      )}

      <Animated.View entering={FadeInDown.duration(800)} className="mb-3 px-2 max-w-[90%] self-center">
        <Text className="text-center text-[20px] leading-snug font-semibold">
          {title}
        </Text>
      </Animated.View>

      {subtitle ? (
        <Animated.View entering={FadeInDown.delay(100).duration(800)} className="mb-3 px-2 max-w-[90%] self-center">
          <Text className="text-center text-[18px] text-tray-700">
            {subtitle}
          </Text>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(200).duration(800)} className="px-3 mb-8 max-w-[92%] self-center">
        <Text className="text-center text-[16px] leading-relaxed font-Jakarta text-tray-600">
          {content}
        </Text>
      </Animated.View>

      {hasAction && (
        <Animated.View entering={FadeInUp.delay(300).duration(800)} className="w-full items-center">
          <CustomButton className="w-[60%] h-14" fontSize="lg" title="Explore" padding={4} onPress={onAgree} />
        </Animated.View>
      )}
    </View>
  );
};

export default InfoScreen;

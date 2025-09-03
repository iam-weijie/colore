import React, { useState, useRef } from 'react';
import { FlatList, Dimensions, View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import Animated, { 
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInDown,
  SlideInRight,
  SlideInLeft,
  ZoomIn,
  BounceIn,
  Easing,
  SlideInUp
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { characters, icons } from '@/constants';
import { Link, router, useRouter } from "expo-router";
import CustomButton from '@/components/CustomButton';
import InfoScreen from './InfoScreen';
import CarrouselIndicator from './CarrouselIndicator';
import Header from './Header';

const { width } = Dimensions.get("window");

// --------- DATA (unchanged) ---------
const slides = [
  {
    title: "Color & Read",
    subtitle: "",
    image: characters.steveAmazed,
    content: "Whether you are living la vie en rose or just feeling blue, Coloré is your space to be real.",
    hasAction: false,
    onAgree: () => {},
  }, 
  {
    title: "Meet & Greet",
    subtitle: "",
    image: characters.bobChill,
    content: "A real friend is someone who knows the real you. Meet real friends, and share your colors with them.",
    hasAction: false,
    onAgree: () => {}, 
  }, 
  {
    title: "Create & Share",
    subtitle: "",
    image: characters.rosieMoney,
    content: "Color a board, with your ideas and thoughts. Share it with the world or keep it for yourself to never forget them.",
    hasAction: false,
    onAgree: () => {}, 
  }, 
];

const LandingPage = () => {
  // --------- STATE / REFS (unchanged) ---------
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const bgVariant = ["gradient2", "gradient3", "gradient4"];
  const bgVariantHex = [
    ["#54C1EE", "#91C5FC", "#54C1EE"],
    ["#FFB85A", "#FF8864", "#FFB85A"],
    ["#FF99CC", "#FFCCF2", "#FF99CC"]
  ];

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(slideIndex);
  };

  return (
    <Animated.View 
      className="flex-1"
    >
      {/* Brand multi-stop gradient background */}
      <LinearGradient
        colors={(bgVariantHex[currentIndex] as [string, string, string]) ?? ["#7AA5FF", "#E07AFF", "#FFD36E"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />


      {/* Content in a frosted white card (~70–75% height) */}
                  {/* Title */}
     <Animated.Text 
              entering={FadeInDown.delay(200).duration(800)}
              className="absolute top-[15%] self-center text-white text-[36px] font-JakartaBold mb-3 "
            >
              Coloré
            </Animated.Text>
      <View className="flex-1">
        <View
          className="flex-1 w-full justify-end"
        >
          <View
            className="w-full self-center bg-white rounded-[48px] py-8"
            style={{ height: "75%", maxWidth: 720 }}
          >

            {/* Carousel Indicator (uses slide accent color) */}
            <Animated.View 
              entering={FadeInDown.delay(300).duration(800)}
              className='flex w-full flex-row items-start justify-start mb-4 mx-8'
            >
              {slides.map((slide, index) => (
                <CarrouselIndicator
                  key={slide.title}
                  id={index}
                  index={currentIndex}
                  color={bgVariantHex[currentIndex][0]}
                />
              ))}
            </Animated.View>

            {/* Carousel */}
            <Animated.View 
              style={{ flex: 1 }}
            >
              <FlatList
                ref={flatListRef}
                data={slides}
                keyExtractor={(_, index) => index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                renderItem={({ item, index }) => (
                  <Animated.View 
                    entering={SlideInRight.delay(500 + index * 100).springify()}
                    className="w-screen items-center justify-center"
                  >
                    <InfoScreen
                      title={item.title}
                      subtitle={item.subtitle}
                      image={item.image}
                      content={item.content}
                      hasAction={item.hasAction}
                      onAgree={item.onAgree}
                    />
                  </Animated.View>
                )}
              />
            </Animated.View>

            {/* Buttons */}
            <Animated.View 
              entering={FadeInUp.delay(800).duration(800)}
              className='w-full gap-4 flex flex-col mt-4'
            >
              <View className="flex items-center w-full">
                <CustomButton
                  fontSize="lg"
                  title="Sign Up"
                  padding={4}
                  onPress={() => router.push("/auth/sign-up")}
                  bgVariant={bgVariant[currentIndex]} // unchanged, still uses slide accent
                />
              </View>

              <Animated.View 
                entering={FadeInUp.delay(900).duration(800)}
                className="flex items-center w-full"
              >
                <CustomButton
                  fontSize="lg"
                  title="Log In"
                  padding={4}
                  onPress={() => router.push("/auth/log-in")}
                />
              </Animated.View>
            </Animated.View>

            {/* Terms / Privacy */}
            <Animated.Text 
              entering={FadeIn.delay(1000).duration(800)}
              className="text-xs text-black/60 text-center mt-4 mx-8"
            >
              By continuing, you agree to our{" "}
              <Link href="https://www.termsfeed.com/live/6e904e78-161a-46ce-b707-7dc6462d1422">
                <Text className="text-black underline">Terms of Service</Text>
              </Link>{" "}
              and{" "}
              <Link href="https://www.termsfeed.com/live/83f5c527-834f-4373-88d0-4428498b6537">
                <Text className="text-black underline">Privacy Policy</Text>
              </Link>
              .
            </Animated.Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

export default LandingPage;

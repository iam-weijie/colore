import React, { useState, useRef } from 'react';
import { FlatList, Dimensions, View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
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
import { characters, icons } from '@/constants';
import { Link, router, useRouter } from "expo-router";
import CustomButton from '@/components/CustomButton';
import InfoScreen from './InfoScreen';
import CarrouselIndicator from './CarrouselIndicator';
import Header from './Header';

const { width } = Dimensions.get("window");
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
]

const LandingPage = () => {
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const bgVariant = ["gradient2", "gradient3", "gradient4"]
    const bgVariantHex = [["#54C1EE", "#91C5FC", "#54C1EE"], ["#FFB85A", "#FF8864", "#FFB85A"], ["#FF99CC", "#FFCCF2", "#FF99CC"]]
  
    const handleScroll = (event: any) => {
      const slideIndex = Math.round(
        event.nativeEvent.contentOffset.x / width
      );
      setCurrentIndex(slideIndex);
    };

    
  return (
    <Animated.View 
      entering={FadeIn.duration(500)}
      className="flex-1 bg-white  pb-8"
    >
      {/* Top Header */}
      <Animated.View 
        entering={SlideInUp.duration(800)}
      >
        <LinearGradient
          colors={bgVariantHex[currentIndex]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="w-full items-start justify-center rounded-b-[48px] pt-12 pl-11 min-h-[16%] pb-4 mb-6"
        >   
          <Animated.Text 
            entering={FadeInDown.delay(200).duration(800)}
            className="text-white text-[28px] font-JakartaBold"
          >
            Coloré
          </Animated.Text>
        
        </LinearGradient>
      </Animated.View>

      {/* Carousel Indicator */}
      <Animated.View 
        entering={FadeInDown.delay(300).duration(800)}
        className='flex w-full flex-row items-start justify-start px-11 mb-4'
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
        entering={ZoomIn.delay(400).duration(800).springify()}
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

      {/* Sign Up Buttons */}
      <Animated.View 
        entering={FadeInUp.delay(800).duration(800)}
        className='w-full gap-4 flex flex-col mb-8'
      >
        <View className="flex items-center w-full">
          <CustomButton
            fontSize="lg"
            title="Sign Up"
            padding={4}
            onPress={() => router.push("/auth/sign-up")}
            bgVariant={bgVariant[currentIndex]}
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

      {/* Footer Text */}
      <Animated.Text 
        entering={FadeIn.delay(1000).duration(800)}
        className="text-xs text-gray-400 text-center mx-6"
      >
        By continuing, you agree to our{" "}
        <Link href="https://www.termsfeed.com/live/6e904e78-161a-46ce-b707-7dc6462d1422">
          <Text className="text-primary-500">Terms of Service</Text>
        </Link>{" "}
        and{" "}
        <Link href="https://www.termsfeed.com/live/83f5c527-834f-4373-88d0-4428498b6537">
          <Text className="text-primary-500">Privacy Policy</Text>
        </Link>
        .
      </Animated.Text>
    </Animated.View>
  );
};

export default LandingPage;
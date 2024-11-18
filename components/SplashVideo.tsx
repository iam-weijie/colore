import React, { useRef, useEffect } from 'react'
import LottieView from 'lottie-react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

const SplashVideo = ({onAnimationFinish}: {onAnimationFinish: (isCancelled: boolean) => void}) => {
    const animation = useRef<LottieView>(null)

    useEffect(() => {
        const timer = setTimeout(() => {
            console.log('Animation forcibly completed');
            onAnimationFinish(false);
        }, 5000); // Fallback timeout after 5 seconds

        return () => clearTimeout(timer);
    }, [onAnimationFinish]);

    return (
      <Animated.View style={{alignItems: 'center', justifyContent: 'center'}} exiting={FadeOut.duration(300)}>
         <LottieView
          ref={animation}
          onAnimationFinish={(isCancelled) => {
            console.log('Native onAnimationFinish called', { isCancelled });
            onAnimationFinish(isCancelled);
          }}
          loop={false}
          autoPlay
          style={{
            width:"100%",
            height:"100%",
            minWidth: 500,
            minHeight: 500,
            backgroundColor: '#eee',
          }}
          source={require('../assets/splash.json')}
      />
      </Animated.View>
    )
}

export default SplashVideo;
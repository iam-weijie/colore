import React, {useRef} from 'react'
import LottieView from 'lottie-react-native';
import Animated, { FadeOut } from 'react-native-reanimated';


const SplashVideo = ({onAnimationFinish = (isCancelled) => {}}: {onAnimationFinish?: (isCancelled: boolean) => void;}) => {
    const animation = useRef<LottieView>(null)

    return (
      <Animated.View style={{alignItems: 'center', justifyContent: 'center',}} exiting={FadeOut.duration(300)}>
         <LottieView
          ref={animation}
          onAnimationFinish={onAnimationFinish}
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


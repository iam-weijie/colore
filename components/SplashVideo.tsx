import LottieView from "lottie-react-native";
import React, { useRef } from "react";
import Animated, { FadeOut } from "react-native-reanimated";

const SplashVideo = ({
  onAnimationFinish,
}: {
  onAnimationFinish: (isCancelled: boolean) => void;
}) => {
  const animation = useRef<LottieView>(null);

  return (
    <Animated.View
      style={{ alignItems: "center", justifyContent: "center" }}
      exiting={FadeOut.duration(300)}
    >
      <LottieView
        ref={animation}
        onAnimationFinish={(isCancelled) => {
          //console.log('Native onAnimationFinish called', { isCancelled });
          onAnimationFinish(isCancelled);
        }}
        loop={false}
        autoPlay
        style={{
          width: "100%",
          height: "100%",
          minWidth: 500,
          minHeight: 500,
          backgroundColor: "#eee",
        }}
        source={require("../assets/splash.json")}
      />
    </Animated.View>
  );
};

export default SplashVideo;

import { useGlobalContext } from "@/app/globalcontext";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects"; // Import sound hook
import { useSoundGesture } from "@/hooks/useSoundGesture"; // Import swipe sound hook
import { fetchAPI } from "@/lib/fetch";
import {
  convertToLocal,
  formatDateTruncatedMonth,
  getRelativeTime,
} from "@/lib/utils";
import { PostModalProps } from "@/types/type";
import {
  View,
  Modal,
  Animated,
  Easing,
  Dimensions,
  Pressable,
  Text,
} from "react-native";
import React, { useEffect, useRef } from "react";
import StarringContainer from "./StarringContainer";

const { height } = Dimensions.get("window");

const StarringModal: React.FC<PostModalProps> = ({
  isVisible,
  selectedPosts,
  handleCloseModal,
  handleUpdate,
  invertedColors = false,
  header,
  isPreview = false,
  infiniteScroll = false,
  scrollToLoad,
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Slide up animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide down animation
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();

      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const backgroundStyle = {
    opacity: fadeAnim,
  };

  const modalStyle = {
    transform: [{ translateY: slideAnim }],
  };

  return (
    <>
      <Animated.View
        className="w-full h-full"
        style={[
          {
            flex: 1,
            position: "absolute",
            backgroundColor: "rgba(250,250,250,1)",
          },
          backgroundStyle,
          modalStyle,
        ]}
      >
        {/* Pressable area to close modal when background is tapped */}
        <Pressable style={{ flex: 1 }} onPress={handleCloseModal} />

        {/* Animated Content */}
        <StarringContainer
          selectedPosts={selectedPosts}
          handleCloseModal={handleCloseModal}
          handleUpdate={handleUpdate}
          invertedColors={invertedColors}
          isPreview={isPreview}
          header={header}
          infiniteScroll={infiniteScroll}
          scrollToLoad={scrollToLoad}
        />
      </Animated.View>
    </>
    // <Modal
    //   visible={isVisible}
    //   transparent={true}
    //   animationType="none" // We're handling animation manually
    //   onRequestClose={handleCloseModal}
    // >
    //   {/* Animated Background */}
    //   <Animated.View
    //     className="w-full h-full"
    //     style={[
    //       {
    //         flex: 1,
    //         position: "absolute",
    //         backgroundColor: "rgba(250,250,250,1)",
    //       },
    //       backgroundStyle,
    //       modalStyle,
    //     ]}
    //   >
    //     {header}
    //     {/* Pressable area to close modal when background is tapped */}
    //     <Pressable style={{ flex: 1 }} onPress={handleCloseModal} />

    //     {/* Animated Content */}
    //     <StarringContainer
    //       selectedPosts={selectedPosts}
    //       handleCloseModal={handleCloseModal}
    //       handleUpdate={handleUpdate}
    //       invertedColors={invertedColors}
    //       isPreview={isPreview}
    //       header={header}
    //       infiniteScroll={infiniteScroll}
    //       scrollToLoad={scrollToLoad}
    //     />
    //   </Animated.View>
    // </Modal>
  );
};

export default StarringModal;

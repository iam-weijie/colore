import { PostModalProps } from "@/types/type";
import { View, Modal, Animated, Easing, Dimensions, Pressable, Text, Platform } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import PostContainer from "./post-container/PostContainer";
import { useEncryptionContext } from "@/app/contexts/EncryptionContext";
import { useDecryptPosts } from "@/hooks/useDecrypt";

const { height } = Dimensions.get('window');

const PostModal: React.FC<PostModalProps> = ({
  isVisible,
  selectedPosts,
  handleCloseModal,
  handleUpdate,
  invertedColors = false,
  header,
  isPreview = false,
  infiniteScroll = false,
  scrollToLoad,
  seeComments = false,
  allowedComments = true
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const { encryptionKey } = useEncryptionContext();
  const [processedPosts, setProcessedPosts] = useState(selectedPosts);

  // Use the new decrypt posts hook
  const { decryptPosts } = useDecryptPosts({
    encryptionKey,
    debugPrefix: "PostModal"
  });
  
  // Process posts for decryption if needed
  useEffect(() => {
    if (!selectedPosts || selectedPosts.length === 0 || !encryptionKey) {
      setProcessedPosts(selectedPosts);
      return;
    }

    // Use the hook to decrypt posts
    const decryptedPosts = decryptPosts(selectedPosts);
    setProcessedPosts(decryptedPosts);
  }, [selectedPosts, encryptionKey, decryptPosts]);

  useEffect(() => {
    if (isVisible) {
      setIsAnimationComplete(false);
      
      // Reset animations to initial state
      slideAnim.setValue(height);
      fadeAnim.setValue(0);
      
      // Sequence: Slide up first, then fade in
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsAnimationComplete(true);
      });
    } else {
      setIsAnimationComplete(false);
      
      // Sequence: Fade out first, then slide down
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isVisible]);

  const backgroundStyle = {
    opacity: fadeAnim,
  };

  const modalStyle = {
    transform: [{ translateY: slideAnim }],
  };

  // Android needs different handling for modal touch events
  const platformProps = Platform.OS === 'android' ? {
    hardwareAccelerated: true,
    statusBarTranslucent: true,
  } : {};

  console.log("[Post Modal] is rendering")
  
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none" // We're handling animation manually
      onRequestClose={handleCloseModal}
      {...platformProps}
    >
      {/* Animated Background */}
      <Animated.View 
        className="w-full h-full"
        style={[
          {
            flex: 1,
            position: "absolute",
            backgroundColor: "rgba(250,250,250,1)",
            width: '100%',
            height: '100%'
          },
          backgroundStyle,
          modalStyle
        ]}
      >
        {/* Pressable area to close modal when background is tapped */}
        <Pressable 
          style={{ 
            flex: 1,
            width: '100%',
            height: '100%' 
          }} 
          onPress={handleCloseModal}
          android_ripple={Platform.OS === 'android' ? { color: 'rgba(250,250,250,0.1)' } : undefined}
        />

        {/* Only render PostContainer after animation completes */}
        {isAnimationComplete && (
          <PostContainer 
            selectedPosts={processedPosts} 
            handleCloseModal={handleCloseModal} 
            handleUpdate={handleUpdate} 
            invertedColors={invertedColors} 
            isPreview={isPreview}
            header={header}
            infiniteScroll={infiniteScroll}
            scrollToLoad={scrollToLoad} 
            seeComments={seeComments}
            allowedComments={allowedComments}
          />
        )}
      </Animated.View>
    </Modal>
  )
}

export default PostModal;
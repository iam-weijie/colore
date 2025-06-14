import { PostModalProps } from "@/types/type";
import { View, Modal, Animated, Easing, Dimensions, Pressable, Text, Platform } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import PostContainer from "./PostContainer";
import { useGlobalContext } from "@/app/globalcontext";
import { decryptText } from "@/lib/encryption";

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
  seeComments = false
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const { encryptionKey } = useGlobalContext();
  const [processedPosts, setProcessedPosts] = useState(selectedPosts);

  console.log("[PostModal] See Comment: ", seeComments);
  
  // Process posts for decryption if needed
  useEffect(() => {
    if (!selectedPosts || selectedPosts.length === 0 || !encryptionKey) {
      setProcessedPosts(selectedPosts);
      return;
    }

    // Try to decrypt posts if they appear to be encrypted
    const decryptedPosts = selectedPosts.map(post => {
      if (post.recipient_user_id && 
          typeof post.content === 'string' && 
          post.content.startsWith('U2FsdGVkX1')) {
        try {
          console.log("[DEBUG] PostModal - Attempting to decrypt post:", post.id);
          const decryptedContent = decryptText(post.content, encryptionKey);
          console.log("[DEBUG] PostModal - Decrypted content:", decryptedContent.substring(0, 30));
          
          // Handle formatting - check both formatting and formatting_encrypted fields
          let decryptedFormatting = post.formatting;
          
          // If formatting_encrypted exists, it takes precedence (newer format)
          if (post.formatting_encrypted && typeof post.formatting_encrypted === "string") {
            try {
              const decryptedFormattingStr = decryptText(post.formatting_encrypted, encryptionKey);
              decryptedFormatting = JSON.parse(decryptedFormattingStr);
              console.log("[DEBUG] PostModal - Successfully decrypted formatting_encrypted field");
            } catch (formattingError) {
              console.warn("[DEBUG] PostModal - Failed to decrypt formatting_encrypted for post", post.id, formattingError);
            }
          } 
          // Otherwise try the old way (formatting as encrypted string)
          else if (post.formatting && typeof post.formatting === "string" && 
                  ((post.formatting as string).startsWith('U2FsdGVkX1') || (post.formatting as string).startsWith('##FALLBACK##'))) {
            try {
              const decryptedFormattingStr = decryptText(post.formatting as unknown as string, encryptionKey);
              decryptedFormatting = JSON.parse(decryptedFormattingStr);
              console.log("[DEBUG] PostModal - Successfully decrypted formatting string");
            } catch (formattingError) {
              console.warn("[DEBUG] PostModal - Failed to decrypt formatting for post", post.id, formattingError);
            }
          }
          
          return { 
            ...post, 
            content: decryptedContent, 
            formatting: decryptedFormatting 
          };
        } catch (e) {
          console.warn("[DEBUG] PostModal - Failed decryption for post", post.id, e);
          return post;
        }
      }
      return post;
    });
    
    setProcessedPosts(decryptedPosts);
  }, [selectedPosts, encryptionKey]);

  
  useEffect(() => {
    if (isVisible) {
      setIsAnimationComplete(false);
      // Slide up animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setIsAnimationComplete(true);
        });
      });
    } else {
      setIsAnimationComplete(false);
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        // Slide down animation
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start();
      });
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
          android_ripple={Platform.OS === 'android' ? { color: 'rgba(0,0,0,0.1)' } : undefined}
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
          />
        )}
      </Animated.View>
    </Modal>
  )
}

export default PostModal;
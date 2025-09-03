import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Text,
  TouchableWithoutFeedback,
  View,
  Image,
} from "react-native";
import { allColors } from "@/constants/colors";
import { PostWithPosition } from "@/types/type";
import PostIt from "@/components/PostIt";
import { useStacksManager} from "@/app/contexts/StacksContext";
import { icons } from "@/constants";

interface DraggablePostItProps {
  post: PostWithPosition;
  updateIndex: () => void;
  position: { top: number; left: number };
  updatePosition: (dx: number, dy: number) => void;
  onPress: () => void;
  showText?: boolean;
  isViewed?: boolean;
  scrollOffset: { x: number; y: number };
  zoomScale: number;
  disabled: boolean;
  visibility: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  enabledPan?: () => void; // Re-added this prop that was missing
}

const DraggablePostIt: React.FC<DraggablePostItProps> = ({
  post,
  position,
  updateIndex,
  updatePosition,
  onPress,
  showText = false,
  isViewed = false,
  scrollOffset,
  zoomScale,
  disabled = false,
  visibility = 1,
  onDragStart,
  onDragEnd,
  enabledPan,
}) => {

  const { stacks } = useStacksManager();

  // Animated values for visual effects during drag
  const animatedPosition = useRef(
    new Animated.ValueXY({
      x: 0, // Start at 0 for relative positioning
      y: 0,
    })
  ).current;

  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const shadowOpacity = useRef(new Animated.Value(0.2)).current;

  // State and refs for tracking component state
  const clickThreshold = 5; // Reduced for better touch handling
  const moveThreshold = 3; // Reduced for earlier movement detection
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fontColor, setFontColor] = useState<string>("#0000ff");
  const [isPinned, setIsPinned] = useState<boolean>(post.pinned);
  
  // Track cumulative position changes
  const accumulatedPosition = useRef({ x: 0, y: 0 });
  const initialPosition = useRef({ x: position.left, y: position.top });
  
  // Drag state tracking
  const dragStartTime = useRef(0);
  const isDragValid = useRef(false);
  const hasMovedSignificantly = useRef(false);

  // Helper function to get font color based on post color
  const getFontColorHex = (colorName: string | undefined) => {
    const foundColor = allColors.find((c) => c.id === colorName);
    setFontColor(foundColor?.fontColor || "#ff0000");
  };

  // Keep state in sync with prop changes
  useEffect(() => {
    setIsPinned(post.pinned);
  }, [post.pinned]);

  useEffect(() => {
    getFontColorHex(post.color);
  }, [post.color]);

  // Reset position when the position prop changes externally
  useEffect(() => {
    initialPosition.current = { x: position.left, y: position.top };
    accumulatedPosition.current = { x: 0, y: 0 };
    animatedPosition.setValue({ x: 0, y: 0 });
  }, [position.left, position.top]);

  // Start drag animation with parallel animations
  const startDragAnimation = () => {
 
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1.1,
        useNativeDriver: false,
      }),
      Animated.spring(rotation, {
        toValue: (Math.random() - 0.5) * 0.1, // Random slight rotation
        useNativeDriver: false,
      }),
      Animated.timing(shadowOpacity, {
        toValue: 0.4,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // End drag animation
  const endDragAnimation = () => {
   
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: false,
      }),
      Animated.spring(rotation, {
        toValue: 0,
        friction: 4,
        tension: 50,
        useNativeDriver: false,
      }),
      Animated.timing(shadowOpacity, {
        toValue: 0.2,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // PanResponder logic for handling gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        return !disabled && !isPinned;
      },
      
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const shouldMove = !disabled && !isPinned && (
          Math.abs(gestureState.dx) > moveThreshold ||
          Math.abs(gestureState.dy) > moveThreshold
        );
        
        return shouldMove;
      },

      onPanResponderGrant: () => {
        
        if (isPinned) {
          onPress();
          return;
        }

        // Initialize drag state
        dragStartTime.current = Date.now();
        isDragValid.current = true;
        hasMovedSignificantly.current = false;
        
        // Update z-index for this post
        updateIndex();
        
        // Notify parent and start animations
        onDragStart?.(); // Notify parent that dragging has started
        setIsDragging(true);
        
        // Extract current offset to make future movements relative
        animatedPosition.extractOffset();
        startDragAnimation();
      },

      onPanResponderMove: (event, gestureState) => {
        if (isPinned || !isDragValid.current) {
          return;
        }
        
        // Track if we've moved significantly
        if (!hasMovedSignificantly.current && 
            (Math.abs(gestureState.dx) > clickThreshold || Math.abs(gestureState.dy) > clickThreshold)) {
          hasMovedSignificantly.current = true;

        }
        
        // Apply movement with zoom correction
        const adjustedDx = gestureState.dx / zoomScale;
        const adjustedDy = gestureState.dy / zoomScale;
        
        animatedPosition.setValue({
          x: adjustedDx,
          y: adjustedDy,
        });

        // Subtle rotation based on velocity for natural feel
        const rotate = Math.max(-0.05, Math.min(0.05, gestureState.vx * 0.01));
        rotation.setValue(rotate);
        
      },

      onPanResponderRelease: (event, gestureState) => {

        
        if (isPinned) {

          isDragValid.current = false;
          return;
        }

        // Calculate if this was a click or drag
        const dragDuration = Date.now() - dragStartTime.current;
        const isClick = !hasMovedSignificantly.current && 
                       Math.abs(gestureState.dx) < clickThreshold && 
                       Math.abs(gestureState.dy) < clickThreshold &&
                       dragDuration < 300;
        

        if (isClick) {
          console.log("👆 [POST-IT] Click detected - showing modal");
          // Reset position for click
          animatedPosition.setValue({ x: 0, y: 0 });
          onPress();
        } else if (isDragValid.current && hasMovedSignificantly.current) {
          
          // Finalize the position
          animatedPosition.extractOffset();
          
          // Calculate new absolute position
          const correctedDx = gestureState.dx / zoomScale;
          const correctedDy = gestureState.dy / zoomScale;
          
          // Update accumulated position
          accumulatedPosition.current.x += correctedDx;
          accumulatedPosition.current.y += correctedDy;
          
          // Calculate final absolute position
          const finalX = initialPosition.current.x + accumulatedPosition.current.x;
          const finalY = initialPosition.current.y + accumulatedPosition.current.y;
          
          
          // Update position in parent - call with correct parameters
          updatePosition(finalX, finalY); // dx and dy for position update
        }

        // Clean up drag state
        setIsDragging(false);
        isDragValid.current = false;
        hasMovedSignificantly.current = false;
        endDragAnimation();
        
        // Notify parent that drag has ended
        onDragEnd?.();
      },

      onPanResponderTerminate: () => {
        
        // Clean up if gesture is terminated unexpectedly
        setIsDragging(false);
        isDragValid.current = false;
        hasMovedSignificantly.current = false;
        endDragAnimation();
        onDragEnd?.(); // Notify parent that drag has ended
      },

      // Prevent termination during active drag - this is key to preventing premature termination
      onPanResponderTerminationRequest: () => {
        const shouldTerminate = !isDragValid.current || !hasMovedSignificantly.current;
        return shouldTerminate;
      },

      // Add these properties to make the PanResponder more robust
      onShouldBlockNativeResponder: () => {
        // Block native responder when we're actively dragging
        return isDragValid.current && hasMovedSignificantly.current;
      },

      onPanResponderReject: () => {

        // Clean up if responder is rejected
        setIsDragging(false);
        isDragValid.current = false;
        hasMovedSignificantly.current = false;
        endDragAnimation();
        onDragEnd?.();
      },

      // Additional properties for better gesture handling
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        // Capture the responder when we start moving
        if (!disabled && !isPinned && isDragValid.current) {
          return true;
        }
        return false;
      },

      onStartShouldSetPanResponderCapture: (evt, gestureState) => {
        // Capture the responder when we start touching
        if (!disabled && !isPinned) {
          return true;
        }
        return false;
      },
    })
  ).current;

  const getRotation = (id: number) => {
    // Hash id deterministically into [0, 1)
    const hash = ((id * 2654435761) % 360) / 360; // Knuth multiplicative hash
    // Scale to [-12, 12]
    return (hash * 7) - 3.5;
  };

  useEffect(() => {
    const isInStack = stacks.some((s) => s.ids.includes(post.id));

    if (isInStack) {

      const determinisicRotation = getRotation(post.id)
        rotation.setValue(determinisicRotation);
    }
  }, [stacks, post.id]);


  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        transform: [
          { translateX: animatedPosition.x },
          { translateY: animatedPosition.y },
          { scale: scale },
          {
            rotate: rotation.interpolate({
              inputRange: [-1, 1],
              outputRange: ['-5deg', '5deg'],
            }),
          },
        ],
        opacity: visibility,
        position: "absolute",
        top: position.top,
        left: position.left,
        shadowColor: isPinned ? "#FFF" : fontColor,
        shadowOffset: {
          width: 0,
          height: isDragging ? 10 : 3,
        },
        shadowOpacity,
        shadowRadius: isDragging ? 15 : 6,
        elevation: isDragging ? 15 : 6,
        zIndex: disabled ? -1 : (isDragging ? 1000 : 999),
        borderWidth: isPinned ? 3 : 0,
        borderColor: "#fff",
        borderRadius: 20
      }}
    >
      <TouchableWithoutFeedback onPress={onPress}>
        <PostIt
          viewed={isViewed}
          color={post.color || "yellow"} 
        />
      </TouchableWithoutFeedback>
      
      {isPinned && (
        <View className="absolute text-black h-full -top-2 -left-2">
          <View className="p-3 rounded-full bg-[#fff] flex-row items-center justify-start">
            <Image
              source={icons.pin}
              tintColor="black"
              resizeMode="contain"
              className="w-4 h-4"
              style={{
                opacity: 0.8,
                transform: [{ scaleX: -1 }]
              }}
            />
          </View>
        </View>
      )}
      
      {!showText && (
        <View className="absolute text-black w-full h-full items-center justify-center">
          <Text style={{ fontSize: 50 }}>{post.emoji && post.emoji}</Text>
        </View>
      )}
      
      {showText && (
        <View className="absolute w-full h-full items-center justify-center">
          <Text
            className="text-[18px] p-5 text-center font-JakartaSemiBold"
            style={{
              color: fontColor,
              fontStyle: "italic",
            }}
            numberOfLines={5}
            ellipsizeMode="tail"
          >
            {post.content}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

export default DraggablePostIt;
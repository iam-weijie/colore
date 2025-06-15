
    import { icons } from "@/constants";
  import { allColors } from "@/constants/colors";
  import { Post, PostWithPosition, Position, Stacks } from "@/types/type";
  import { useEffect, useRef, useState, useMemo } from "react";
  import PostIt from "@/components/PostIt";
  import {
    Animated,
    Dimensions,
    Easing,
    Image, 
    PanResponder,
    RefreshControl,
    ScrollView,
    Text,
    TouchableWithoutFeedback,
    View,
  } from "react-native";
  import { MappingPostitProps } from "@/types/type";
  import { SoundType, useSoundEffects } from "@/hooks/useSoundEffects";
  import React from "react";
import { fetchAPI } from "@/lib/fetch";
import { useStacks } from "@/app/contexts/StacksContext";

interface DraggablePostItProps {
  post: PostWithPosition;
  updateIndex: () => void;
  position: { top: number; left: number };
  updatePosition: (x: number, y: number, post: PostWithPosition) => void;
  onPress: () => void;
  showText?: boolean;
  isViewed?: boolean;
  enabledPan: () => void;
  scrollOffset: { x: number; y: number };
  zoomScale: number;
  disabled: boolean;
  visibility: number;
}

const DraggablePostIt: React.FC<DraggablePostItProps> = ({
  post,
  position,
  updateIndex,
  updatePosition,
  onPress,
  showText = false,
  isViewed = false,
  enabledPan,
  scrollOffset,
  zoomScale,
  disabled = false,
  visibility = 1,
}) => {
  const { playSoundEffect } = useSoundEffects();

  const animatedPosition = useRef(
    new Animated.ValueXY({
      x: position.left,
      y: position.top,
    })
  ).current;

  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const shadowOpacity = useRef(new Animated.Value(0.2)).current;
  const clickThreshold = 2;
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fontColor, setFontColor] = useState<string>("#0000ff");
  const { stacks, setStacks } = useStacks();
  const [newPosition, setNewPosition] = useState<MappingPostitProps | null>(
    null
  );
  const [isPinned, setIsPinned] = useState<boolean>(post.pinned);

  const accumulatedPosition = useRef({ x: position.left, y: position.top });

  const stackRef = useMemo<Stacks | undefined>(
    () => stacks.find((p) => p.ids.includes(post.id)),
    [stacks, post.id]
  );

  const hasUpdatedPosition = useRef(false);

  const getFontColorHex = (colorName: string | undefined) => {
    const foundColor = allColors.find((c) => c.id === colorName);
    setFontColor(foundColor?.fontColor || "#ff0000");
  };

  useEffect(() => {
    setIsPinned(post.pinned);
  }, [post]);

  useEffect(() => {
    getFontColorHex(post.color);
  }, [post.color]);
  useEffect(() => {
    if (stackRef) {
      const stackCenterX = stackRef?.center?.x;
      const stackCenterY = stackRef?.center?.y;

      const currentPostX = accumulatedPosition.current.x + post.position.left;
      const currentPostY = accumulatedPosition.current.y + post.position.top;

      const dx = stackCenterX - currentPostX;
      const dy = stackCenterY - currentPostY;

      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 20) {
        console.log(">>> Forced move for post:", post.id);
        console.log("Before accumulated:", accumulatedPosition.current);
        console.log("Static post.position:", post.position);
        console.log("Stack center:", stackRef.center);

        // 🔄 Animate by relative delta
        animatedPosition.setValue({ x: dx, y: dy });

        // ✅ Update accumulated position RELATIVELY
        accumulatedPosition.current.x += dx;
        accumulatedPosition.current.y += dy;

        const finalX = post.position.left + accumulatedPosition.current.x;
        const finalY = post.position.top + accumulatedPosition.current.y;

        updatePosition(finalX, finalY, post);

        console.log(">>> Drag End:", post.id, finalX, finalY);
        console.log("After accumulated:", {
          x: accumulatedPosition.current.x + post.position.left,
          y: accumulatedPosition.current.y + post.position.top,
        });
      }
    }
  }, [stackRef?.center.x, stackRef?.center.y]);
  
  
  const handleSyncPosition = async (x: number, y: number) => {
          try {
            await fetchAPI(`/api/posts/updatePostPosition`, {
              method: "PATCH",
              body: JSON.stringify({
                postId: post.id,
                top: y,
                left: x,
              }),
            });
          } catch (err) {
            console.error("Failed to update post position: ", err);
          }
  }

  
    // Start drag animation - ALL animations will use JS driver
    const startDragAnimation = () => {
      playSoundEffect(SoundType.Button);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1.1,
          useNativeDriver: false, // Changed to false
        }),
        Animated.spring(rotation, {
          toValue: 0.05,
          useNativeDriver: false, // Changed to false
        }),
        Animated.timing(shadowOpacity, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: false, // Changed to false
        }),
      ]).start();
    };
  
    // End drag animation - ALL animations will use JS driver
    const endDragAnimation = () => {
      playSoundEffect(SoundType.Button);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: false, // Changed to false
        }),
        Animated.spring(rotation, {
          toValue: 0,
          friction: 3,
          tension: 40,
          useNativeDriver: false, // Changed to false
        }),
        Animated.timing(shadowOpacity, {
          toValue: 0.2,
          duration: 200,
          useNativeDriver: false, // Changed to false
        }),
      ]).start();
    };
 
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
    
        onPanResponderGrant: () => {
          updateIndex();
          if (isPinned) {
            onPress();
            return;
          }
          setIsDragging(true);
          enabledPan();
          animatedPosition.extractOffset();
          startDragAnimation();
        },
    
        onPanResponderMove: (event, gestureState) => {
          if (!isPinned) {
            animatedPosition.setValue({
              x: gestureState.dx,
              y: gestureState.dy,
            });
    
            const rotate = gestureState.vx * 0.02;
            rotation.setValue(rotate);
          }
        },
    
        onPanResponderRelease: (event, gestureState) => {
          if (isPinned) return;
        
          animatedPosition.extractOffset();
        
          // Compute displacement corrected for zoom
          const correctedDx = (gestureState.dx) / zoomScale;
          const correctedDy = (gestureState.dy) / zoomScale;
        
          // Compute final new absolute position
          const dx = accumulatedPosition.current.x + correctedDx - scrollOffset.x;
          const dy = accumulatedPosition.current.y + correctedDy - scrollOffset.y;
          const finalX = dx + position.left;
          const finalY = dy + position.top;
          
        
          // Save new accumulated position locally
          accumulatedPosition.current = {
            x: dx,
            y: dy,
          };

        
          updatePosition(finalX, finalY, post); 
          handleSyncPosition(finalX, finalY)


          if (Math.abs(gestureState.dx) < clickThreshold && Math.abs(gestureState.dy) < clickThreshold) {
            onPress();
          }
        
          setIsDragging(false);
          enabledPan();
          endDragAnimation();
        },  
      })
    ).current;
    
  
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
          top: post.position.top,
          left: post.position.left,
          shadowColor: post.pinned ? "#FFF" : fontColor,
          shadowOffset: {
            width: 0,
            height: isDragging ? 8 : 2,
          },
          shadowOpacity,
          shadowRadius: isDragging ? 12 : 4,
          elevation: isDragging ? 12 : 4,
          zIndex: disabled ? -1 : 999,
          borderWidth: post.pinned ? 3 : 0,
          borderColor: "#fff",
          borderRadius: 20
        }}
      >
        {/* Rest of your component remains exactly the same */}
        <TouchableWithoutFeedback onPress={onPress}>
          <PostIt 
          viewed={isViewed}
          color={post.color || "yellow"} />
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

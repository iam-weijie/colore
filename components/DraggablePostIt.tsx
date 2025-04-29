
  import { useGlobalContext } from "@/app/globalcontext";
  import { icons, temporaryColors } from "@/constants";
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
  import React from "react";

interface DraggablePostItProps {
    post: PostWithPosition;
    updateIndex: () => void;
    position: {top: number, left: number},
    updatePosition: (x: number, y: number, post: PostWithPosition) => void;
    onPress: () => void;
    showText?: boolean;
    enabledPan: () => void;
    scrollOffset: { x: number; y: number }; 
    zoomScale: number;
    disabled: boolean;
    visibility: number; 
  };
  
  const DraggablePostIt: React.FC<DraggablePostItProps> = ({
    post,
    position,
    updateIndex,
    updatePosition,
    onPress,
    showText = false,
    enabledPan,
    scrollOffset,
    zoomScale,
    disabled = false,
    visibility = 1,
  }) => {
    
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
    const { stacks, setStacks } = useGlobalContext();
    const [newPosition, setNewPosition] = useState<MappingPostitProps | null>(null);
    const [isPinned, setIsPinned] = useState<boolean>(post.pinned);

    const accumulatedPosition = useRef({ x: position.left, y: position.top });

    const stackRef = useMemo<Stacks | undefined>(
      () => stacks.find((p) => p.ids.includes(post.id)),
      [stacks, post.id]
    );
  
    const hasUpdatedPosition = useRef(false);

  const getFontColorHex = (colorName: string | undefined) => {
    const foundColor = temporaryColors.find((c) => c.name === colorName);
    setFontColor(foundColor?.fontColor || "#ff0000");
  };


  useEffect(() => {
    setIsPinned(post.pinned)
  }, [post])


  useEffect(() => {
    getFontColorHex(post.color);
  }, [post.color]);
  useEffect(() => {
    if (stackRef) {
      const stackCenterX = stackRef.center.x;
      const stackCenterY = stackRef.center.y;
  
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
  
  

  
    // Start drag animation - ALL animations will use JS driver
    const startDragAnimation = () => {
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

          //console.log("Final position:", finalX, finalY, "Displacement:", dx, dy);
        
          updatePosition(finalX, finalY, post); // (optional) update parent live if you want

        
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
          shadowColor: fontColor,
          shadowOffset: {
            width: 0,
            height: isDragging ? 8 : 2,
          },
          shadowOpacity,
          shadowRadius: isDragging ? 12 : 4,
          elevation: isDragging ? 12 : 4,
          zIndex: disabled ? -1 : 999,
        }}
      >
        {/* Rest of your component remains exactly the same */}
        <TouchableWithoutFeedback onPress={onPress}>
          <PostIt color={post.color || "yellow"} />
        </TouchableWithoutFeedback>
        {isPinned && (
          <View className="absolute text-black h-full -top-2 -left-2">
            <View className="p-[6px] rounded-full bg-[#fafafa] flex-row items-center justify-start">
              <Image 
                source={icons.pin}
                tintColor="black"
                resizeMode="contain"
                className="w-7 h-7"
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
          <View className="absolute text-black w-full h-full items-center justify-center">
            <Text
              className="text-base font-[500] text-black"
              style={{
                color: fontColor,
                padding: 18,
                fontStyle: "italic",
              }}
              numberOfLines={3}
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
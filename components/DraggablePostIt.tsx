
  import { useGlobalContext } from "@/app/globalcontext";
  import { icons, temporaryColors } from "@/constants";
  import { Post, PostWithPosition, Position } from "@/types/type";
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

type DraggablePostItProps = {
    post: PostWithPosition;
    updateIndex: () => void;
    updatePosition: (x: number, y: number, post: PostWithPosition) => void;
    onPress: () => void;
    forceStack: (id: number) => MappingPostitProps;
    showText?: boolean;
    enabledPan: () => void;
  };
  
  const DraggablePostIt: React.FC<DraggablePostItProps> = ({
    post,
    updateIndex,
    updatePosition,
    onPress,
    forceStack,
    showText = false,
    enabledPan
  }) => {
    const position = useRef(new Animated.ValueXY()).current;
    const scale = useRef(new Animated.Value(1)).current;
    const rotation = useRef(new Animated.Value(0)).current;
    const shadowOpacity = useRef(new Animated.Value(0.2)).current;
    const clickThreshold = 2;
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [fontColor, setFontColor] = useState<string>("#0000ff");
    const { stacks, setStacks } = useGlobalContext();
    const [newPosition, setNewPosition] = useState<MappingPostitProps | null>(null);
    const [isPinned, setIsPinned] = useState<boolean>(post.pinned);
  
    const hasUpdatedPosition = useRef(false);

  const getFontColorHex = (colorName: string | undefined) => {
    const foundColor = temporaryColors.find((c) => c.name === colorName);
    setFontColor(foundColor?.fontColor || "#ff0000");
  };

  useEffect(() => {
    if (isPinned) return;
    const listenerId = position.addListener(({ x, y }) => {
      updatePosition(x, y, post);
    });

    return () => {
      position.removeListener(listenerId);
    };
  }, [position, updatePosition, post]);

  useEffect(() => {
    setIsPinned(post.pinned)
  }, [post])


  useEffect(() => {
    getFontColorHex(post.color);
  }, [post.color]);
  

  
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
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          updateIndex();
          if (isPinned) {
            onPress()
            return
          };
          setIsDragging(true);
          enabledPan()
          position.extractOffset();
          startDragAnimation();
        },
        onPanResponderMove: (event, gestureState) => {
          if (!isPinned) {
            position.setValue({ x: gestureState.dx, y: gestureState.dy });
            
            // Update rotation directly
            const rotate = gestureState.vx * 0.02;
            rotation.setValue(rotate);
          }
        },
        onPanResponderRelease: (event, gestureState) => {
          if (isPinned) return;
          const dx = gestureState.dx;
          const dy = gestureState.dy;
          position.extractOffset();
  
          if (Math.abs(dx) < clickThreshold && Math.abs(dy) < clickThreshold) {
            onPress();
          }
          setIsDragging(false);
          enabledPan()
          endDragAnimation();
        },
      })
    ).current;
  
  
    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [
            ...position.getTranslateTransform(),
            { scale },
            { 
              rotate: rotation.interpolate({
                inputRange: [-0.2, 0, 0.2],
                outputRange: ['-5deg', '0deg', '5deg']
              }) 
            },
          ],
          opacity: 1,
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
          zIndex: isDragging ? 999 : 1,
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
              className="text-[14px] font-[500] text-black"
              style={{
                color: fontColor,
                padding: 18,
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
import React, { useEffect, useState } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  runOnJS,
  Easing
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const EMOJI_COUNT = 36;
const DEFAULT_EMOJI = '🎉';
const STAGGER_DELAY = 30;

interface EmojiExplosionModalProps {
  isVisible: boolean;
  onComplete?: () => void;
  emoji?: string;
  radius?: number;
  verticalForce?: number;
  scale?: {
    start?: number;
    end?: number;
  };
  emojiSize?: string;
  duration?: number;
  staggerDelay?: number;
}

const EmojiExplosionModal: React.FC<EmojiExplosionModalProps> = ({
  isVisible,
  onComplete,
  emoji = DEFAULT_EMOJI,
  radius = 120,
  verticalForce = 1.5,
  scale = { start: 1, end: 0.4 },
  emojiSize = 'text-4xl',
  duration = 2000,
  staggerDelay = STAGGER_DELAY,
}) => {
  const [completedAnimations, setCompletedAnimations] = useState(0);
  const emojiAnimations = Array(EMOJI_COUNT).fill(null).map((_, index) => ({
    id: index,
    x: useSharedValue(0),
    y: useSharedValue(0),
    rotation: useSharedValue(Math.random() * 360),
    scale: useSharedValue(scale.start || 1),
  }));

  useEffect(() => {
    if (isVisible) {
      setCompletedAnimations(0); // Reset counter when animation starts
      
      emojiAnimations.forEach((anim, index) => {
        const angle = (Math.PI * 2) * Math.random(); // Your random angle
        const distance = radius * (0.9 + Math.random() * 0.2); // Your distance calculation
        
        const horizontalMovement = Math.cos(angle) * distance;
        const verticalSpread = Math.sin(angle) * distance * 1.7; // Your vertical spread
        const verticalFall = SCREEN_HEIGHT * 0.5 * verticalForce; // Your vertical fall

        setTimeout(() => {
          // Track completion of the longest animation (vertical movement)
          const checkCompletion = () => {
            setCompletedAnimations(prev => {
              const newCount = prev + 1;
              if (newCount === EMOJI_COUNT && onComplete) {
                runOnJS(onComplete)();
              }
              return newCount;
            });
          };

          anim.x.value = withTiming(horizontalMovement, {
            duration,
            easing: Easing.out(Easing.quad)
          });
          
          anim.y.value = withTiming(verticalSpread + verticalFall, {
            duration: duration * 1.2,
            easing: Easing.in(Easing.quad),
            finished: checkCompletion // Attach to longest animation
          });
          
          anim.rotation.value = withTiming(anim.rotation.value + (360 + Math.random() * 180), {
            duration,
            easing: Easing.inOut(Easing.quad)
          });
          
          anim.scale.value = withTiming(scale.end || 0.4, {
            duration: duration * 0.7,
            easing: Easing.out(Easing.back(1))
          });
        }, index * staggerDelay);
      });
    } else {
      emojiAnimations.forEach(anim => {
        anim.x.value = 0;
        anim.y.value = 0;
        anim.scale.value = scale.start || 1;
      });
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <View className="absolute inset-0 justify-center items-center pointer-events-none">
      {emojiAnimations.map((anim) => (
        <Animated.Text
          key={anim.id}
          className={`${emojiSize} absolute`}
          style={{
            transform: [
              { translateX: anim.x },
              { translateY: anim.y },
              { rotate: `${anim.rotation.value}deg` },
              { scale: anim.scale }
            ],
            opacity: 1,
            zIndex: 999
          }}
        >
          {emoji}
        </Animated.Text>
      ))}
    </View>
  );
};

export default EmojiExplosionModal;
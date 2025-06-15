import { useRef, useCallback } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useSoundEffects, SoundType } from './useSoundEffects';
import { useSettingsContext } from "@/app/contexts/SettingsContext";

/**
 * Hook to add sound effects to scroll interactions
 * 
 * @param throttleTime Time in ms to throttle sound effects 
 * @param soundType Sound type to play
 * @returns Object with onScroll handler to attach to scrollable component
 */
export const useSoundScroll = (throttleTime = 500, soundType = SoundType.Scroll) => {
  const { soundEffectsEnabled } = useSettingsContext();
  const { playSoundEffect } = useSoundEffects();
  
  const lastScrollTime = useRef<number>(0);
  const lastScrollY = useRef<number>(0);
  const scrollThreshold = 50; // Minimum scroll distance to trigger sound
  
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!soundEffectsEnabled) return;
    
    const currentTime = Date.now();
    const currentY = event.nativeEvent.contentOffset.y;
    const scrollDistance = Math.abs(currentY - lastScrollY.current);
    
    // Only play sound if enough time has passed since last sound
    // and user has scrolled more than threshold
    if (
      currentTime - lastScrollTime.current > throttleTime && 
      scrollDistance > scrollThreshold
    ) {
      playSoundEffect(soundType);
      lastScrollTime.current = currentTime;
      lastScrollY.current = currentY;
    }
  }, [playSoundEffect, soundEffectsEnabled, soundType, throttleTime]);
  
  return {
    scrollHandlers: {
      onScroll: handleScroll,
      onMomentumScrollBegin: () => {
        if (soundEffectsEnabled) playSoundEffect(soundType);
      },
    }
  };
}; 
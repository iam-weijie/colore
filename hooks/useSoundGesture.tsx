import { useRef, useState, useCallback } from 'react';
import { useSoundEffects, SoundType } from './useSoundEffects';
import { useGlobalContext } from '@/app/globalcontext';
import { GestureStateChangeEvent, GestureUpdateEvent, PanGestureHandler, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';

/**
 * Hook to add sound effects to gesture interactions
 * 
 * @param gestureType The type of gesture (swipe, pinch, etc.)
 * @returns Gesture handler functions to be applied to Gesture.Gesture objects
 */
export const useSoundGesture = (soundType = SoundType.Swipe) => {
  const { soundEffectsEnabled } = useGlobalContext();
  const { playSoundEffect } = useSoundEffects();
  const lastGestureTime = useRef<number>(0);
  const hasPlayedStart = useRef<boolean>(false);
  const isPlayingSound = useRef<boolean>(false);
  const throttleTime = 300; // Throttle time to prevent rapid sound playback

  // Memoized sound playing function with error handling
  const playSoundSafely = useCallback(async (sound: SoundType) => {
    // Skip if sound effects disabled
    if (!soundEffectsEnabled) return;
    
    // Prevent concurrent sound playback attempts
    if (isPlayingSound.current) return;
    
    try {
      isPlayingSound.current = true;
      
      // Use a timeout to ensure we don't block the UI thread
      setTimeout(() => {
        playSoundEffect(sound).catch(error => {
          console.log("[SoundGesture] Error playing sound:", error);
        });
      }, 0);
    } catch (error) {
      console.log("[SoundGesture] Error setting up sound:", error);
    } finally {
      // Reset after a delay to prevent rapid sound triggers
      setTimeout(() => {
        isPlayingSound.current = false;
      }, 100);
    }
  }, [playSoundEffect, soundEffectsEnabled]);

  const onGestureStart = useCallback(() => {
    if (!soundEffectsEnabled) return;
    
    const now = Date.now();
    if (now - lastGestureTime.current > throttleTime) {
      console.log("[SoundGesture] Playing swipe start sound");
      lastGestureTime.current = now;
      hasPlayedStart.current = true;
      
      playSoundSafely(soundType);
    }
  }, [playSoundSafely, soundEffectsEnabled, soundType, throttleTime]);

  const onGestureEnd = useCallback(() => {
    if (!soundEffectsEnabled) return;
    
    // Only play end sound if we've already played start sound and enough time has passed
    const now = Date.now();
    if (hasPlayedStart.current && now - lastGestureTime.current > throttleTime) {
      console.log("[SoundGesture] Playing swipe end sound");
      lastGestureTime.current = now;
      hasPlayedStart.current = false;
      
      playSoundSafely(soundType);
    }
  }, [playSoundSafely, soundEffectsEnabled, soundType, throttleTime]);

  // For use with Gesture.Pan() from react-native-gesture-handler
  const panGestureHandlers = {
    onStart: onGestureStart,
    onEnd: onGestureEnd,
  };
  
  // For use with PanGestureHandler component
  const handlePanGestureEvent = (event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
    // Can add additional logic based on event.nativeEvent if needed
  };
  
  // Generic handler for gesture state changes - handles all state types safely
  const handlePanGestureStateChange = (event: any) => {
    try {
      if (!event || !event.nativeEvent) return;
      
      const state = event.nativeEvent.state;
      
      if (state === 1 || state === 'began') { // began
        onGestureStart();
      } else if (state === 5 || state === 'ended' || state === 'end') { // ended
        onGestureEnd();
      }
    } catch (error) {
      console.log("[SoundGesture] Error in gesture state change:", error);
    }
  };
  
  return {
    panGestureHandlers,
    handlePanGestureEvent,
    handlePanGestureStateChange,
    onGestureStart,
    onGestureEnd
  };
}; 
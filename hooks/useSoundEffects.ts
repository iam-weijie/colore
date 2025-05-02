import { Audio } from 'expo-av';
import { useGlobalContext } from '../app/globalcontext'; // Corrected relative import path
import { useState, useEffect, useRef } from 'react';

// Define sound types/keys and their corresponding file paths
export enum SoundType {
  Tap = 'tap', // Keep tap for potential future use or other generic taps
  ToggleOn = 'toggleOn',
  ToggleOff = 'toggleOff',
  Like = 'like', // Add Like sound type
  Comment = 'comment', // Add Comment sound type
  Navigation = 'navigation', // Sound for navigation between screens
  Button = 'button', // Generic button press sound
  Success = 'success', // For successful operations
  Error = 'error', // For error notifications
  Notification = 'notification', // For receiving notifications
  Swipe = 'swipe', // For swipe gestures
  Send = 'send', // For sending messages or posts
  Delete = 'delete', // For delete operations
  Scroll = 'scroll', // For scroll interactions
  Modal = 'modal', // For modal open/close
  Share = 'share', // For sharing content
  Submit = 'submit', // For form submissions
  Reply = 'reply', // For replying to posts/comments
  Stack = 'stack', // For stacking notes together
}

// NOTE: Ensure these sound files exist at the specified paths
const soundFiles = {
  [SoundType.Tap]: require('../assets/sounds/tap.mp3'),
  [SoundType.ToggleOn]: require('../assets/sounds/toggle.mp3'),
  [SoundType.ToggleOff]: require('../assets/sounds/toggle.mp3'),
  [SoundType.Like]: require('../assets/sounds/like.mp3'), // Map Like type to like.mp3
  [SoundType.Comment]: require('../assets/sounds/comment.mp3'), // Map Comment type to comment.mp3
  [SoundType.Navigation]: require('../assets/sounds/navigation.mp3'), // Use proper navigation sound
  [SoundType.Button]: require('../assets/sounds/button.mp3'), // Use proper button sound
  [SoundType.Success]: require('../assets/sounds/success.mp3'), // Use proper success sound
  [SoundType.Error]: require('../assets/sounds/error.mp3'), // Use proper error sound
  [SoundType.Notification]: require('../assets/sounds/notification.mp3'), // Use proper notification sound
  [SoundType.Swipe]: require('../assets/sounds/swipe.mp3'), // Use proper swipe sound
  [SoundType.Send]: require('../assets/sounds/send.mp3'), // Use proper send sound
  [SoundType.Delete]: require('../assets/sounds/delete.mp3'), // Use proper delete sound
  [SoundType.Scroll]: require('../assets/sounds/scroll.mp3'), // Use proper scroll sound
  [SoundType.Modal]: require('../assets/sounds/modal.mp3'), // Use proper modal sound
  [SoundType.Share]: require('../assets/sounds/share.mp3'), // Use proper share sound
  [SoundType.Submit]: require('../assets/sounds/submit.mp3'), // Use proper submit sound
  [SoundType.Reply]: require('../assets/sounds/reply.mp3'), // Use proper reply sound
  [SoundType.Stack]: require('../assets/sounds/stack.mp3'), // Use proper stack sound
};

// Map to store preloaded sound objects
const soundCache = new Map<SoundType, Audio.Sound>();

// Default volume for all sound effects
const DEFAULT_VOLUME = 1.0;

export const useSoundEffects = () => {
  const { soundEffectsEnabled } = useGlobalContext();
  // State to track last played time for debouncing
  const [lastPlayed, setLastPlayed] = useState<{ [key in SoundType]?: number }>({});
  const soundsInProgress = useRef<Set<Audio.Sound>>(new Set());
  const soundQueue = useRef<SoundType[]>([]);
  const isProcessingQueue = useRef<boolean>(false);
  const DEBOUNCE_INTERVAL = 200; // ms for debouncing same sound type

  // Preload sounds for better performance and consistency
  useEffect(() => {
    const preloadSounds = async () => {
      try {
        // Only preload the most commonly used sounds
        const commonSounds = [
          SoundType.Button, 
          SoundType.Tap, 
          SoundType.Navigation,
          SoundType.Scroll
        ];
        
        for (const type of commonSounds) {
          if (!soundCache.has(type)) {
            const { sound } = await Audio.Sound.createAsync(
              soundFiles[type],
              { volume: DEFAULT_VOLUME, isLooping: false },
              null,
              false // Don't play immediately
            );
            soundCache.set(type, sound);
          }
        }
      } catch (error) {
        console.error('[SoundEffect] Error preloading sounds:', error);
      }
    };
    
    preloadSounds();
    
    // Clean up preloaded sounds on unmount
    return () => {
      soundCache.forEach(async (sound) => {
        try {
          await sound.unloadAsync();
        } catch (error) {
          // Silently ignore unload errors
        }
      });
      soundCache.clear();
    };
  }, []);

  // Play sound with better error handling and consistent volume
  const playSound = async (type: SoundType): Promise<boolean> => {
    try {
      // Create a new sound instance every time to avoid cut-off issues
      const { sound } = await Audio.Sound.createAsync(
        soundFiles[type],
        { volume: DEFAULT_VOLUME, isLooping: false }
      );
      
      // Add to tracking set to ensure we don't unload too early
      soundsInProgress.current.add(sound);
      
      // Set up completion listener
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded) {
          if (status.didJustFinish || !status.isPlaying) {
            // Remove from tracking set
            soundsInProgress.current.delete(sound);
            
            // Unload after playing to free up resources
            try {
              await sound.unloadAsync();
            } catch (error) {
              // Silently ignore unload errors
            }
          }
        }
      });
      
      // Play the sound with a small delay to ensure it's fully loaded
      await new Promise(resolve => setTimeout(resolve, 10));
      await sound.playAsync();
      return true;
    } catch (error) {
      console.error(`[SoundEffect] Play error for ${type}:`, error);
      return false;
    }
  };
  
  // Process queue with improved handling
  const processQueue = async () => {
    if (isProcessingQueue.current) return;
    if (soundQueue.current.length === 0) return;
    
    isProcessingQueue.current = true;
    
    try {
      while (soundQueue.current.length > 0) {
        const nextSound = soundQueue.current.shift();
        if (nextSound) {
          await playSound(nextSound);
          // Longer delay between sounds to prevent overlapping and cutting off
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('[SoundEffect] Queue processing error:', error);
    } finally {
      isProcessingQueue.current = false;
    }
  };

  const playSoundEffect = async (type: SoundType) => {
    console.log(`[SoundEffect] Attempting to play type: ${type}`);
    
    // Skip if sound effects are disabled
    if (!soundEffectsEnabled) {
      console.log(`[SoundEffect] Sound effects disabled. Skipping play for type: ${type}`);
      return;
    }
    
    // Debounce check for rapid firing of same sound type
    const now = Date.now();
    if (lastPlayed[type] && now - (lastPlayed[type] as number) < DEBOUNCE_INTERVAL) {
      console.log(`[SoundEffect] Debounced play for type: ${type}`);
      return;
    }
    
    // Update last played time
    setLastPlayed((prev) => ({ ...prev, [type]: now }));
    
    // Add to queue and process
    soundQueue.current.push(type);
    processQueue();
  };

  return { playSoundEffect };
};
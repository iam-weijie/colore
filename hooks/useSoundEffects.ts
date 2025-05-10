import { Audio } from 'expo-av';
import { useGlobalContext } from '../app/globalcontext';
import { useState, useEffect, useRef } from 'react';

export enum SoundType {
  Tap = 'tap',
  ToggleOn = 'toggleOn',
  ToggleOff = 'toggleOff',
  Like = 'like',
  Comment = 'comment',
  Navigation = 'navigation',
  Button = 'button',
  Success = 'success',
  Error = 'error',
  Notification = 'notification',
  Swipe = 'swipe',
  Send = 'send',
  Delete = 'delete',
  Scroll = 'scroll',
  Modal = 'modal',
  Share = 'share',
  Submit = 'submit',
  Reply = 'reply',
  Stack = 'stack',
}

const soundFiles = {
  [SoundType.Tap]: require('../assets/sounds/tap.mp3'),
  [SoundType.ToggleOn]: require('../assets/sounds/toggle.mp3'),
  [SoundType.ToggleOff]: require('../assets/sounds/toggle.mp3'),
  [SoundType.Like]: require('../assets/sounds/like.mp3'),
  [SoundType.Comment]: require('../assets/sounds/comment.mp3'),
  [SoundType.Navigation]: require('../assets/sounds/navigation.mp3'),
  [SoundType.Button]: require('../assets/sounds/button.mp3'),
  [SoundType.Success]: require('../assets/sounds/success.mp3'),
  [SoundType.Error]: require('../assets/sounds/error.mp3'),
  [SoundType.Notification]: require('../assets/sounds/notification.mp3'),
  [SoundType.Swipe]: require('../assets/sounds/swipe.mp3'),
  [SoundType.Send]: require('../assets/sounds/send.mp3'),
  [SoundType.Delete]: require('../assets/sounds/delete.mp3'),
  [SoundType.Scroll]: require('../assets/sounds/scroll.mp3'),
  [SoundType.Modal]: require('../assets/sounds/modal.mp3'),
  [SoundType.Share]: require('../assets/sounds/share.mp3'),
  [SoundType.Submit]: require('../assets/sounds/submit.mp3'),
  [SoundType.Reply]: require('../assets/sounds/reply.mp3'),
  [SoundType.Stack]: require('../assets/sounds/stack.mp3'),
};

// Global sound cache that persists across hook instances
const soundCache = new Map<SoundType, Audio.Sound>();
const DEFAULT_VOLUME = 1.0;
const DEBOUNCE_INTERVAL = 200; // ms for debouncing same sound type
const COMMON_SOUNDS = [
  SoundType.Button,
  SoundType.Tap,
  SoundType.Navigation,
  SoundType.Scroll,
  SoundType.ToggleOn,
  SoundType.ToggleOff,
  SoundType.Like,
  SoundType.Comment
];

// Preload sounds during app initialization (call this in your App.tsx or root component)
export const preloadCommonSounds = async () => {
  console.log("Preloading common sounds...");
  try {
    await Promise.all(COMMON_SOUNDS.map(async (type) => {
      if (!soundCache.has(type)) {
        const { sound } = await Audio.Sound.createAsync(
          soundFiles[type],
          { volume: DEFAULT_VOLUME, isLooping: false },
          null,
          false
        );
        soundCache.set(type, sound);
        console.log(`Preloaded sound: ${type}`);
      }
    }));
    console.log("Common sounds preloaded successfully");
  } catch (error) {
    console.error('Error preloading common sounds:', error);
  }
};

export const useSoundEffects = () => {
  const { soundEffectsEnabled } = useGlobalContext();
  const [lastPlayed, setLastPlayed] = useState<{ [key in SoundType]?: number }>({});
  const soundQueue = useRef<SoundType[]>([]);
  const isProcessingQueue = useRef<boolean>(false);
  const activeSounds = useRef<Set<Audio.Sound>>(new Set());

  const playSound = async (type: SoundType): Promise<boolean> => {
    if (!soundEffectsEnabled) return false;

    try {
      // Check if sound is preloaded
      let sound: Audio.Sound;
      
      if (soundCache.has(type)) {
        // Use preloaded sound
        sound = soundCache.get(type)!;
        await sound.replayAsync(); // More efficient than creating new instance
      } else {
        // Load on demand for less common sounds
        const { sound: newSound } = await Audio.Sound.createAsync(
          soundFiles[type],
          { volume: DEFAULT_VOLUME, isLooping: false }
        );
        sound = newSound;
      }

      activeSounds.current.add(sound);
      
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && (status.didJustFinish || !status.isPlaying)) {
          activeSounds.current.delete(sound);
          // Don't unload preloaded sounds
          if (!soundCache.has(type)) {
            try {
              await sound.unloadAsync();
            } catch (error) {
              console.warn(`Error unloading sound ${type}:`, error);
            }
          }
        }
      });

      await sound.playAsync();
      return true;
    } catch (error) {
      console.error(`Error playing sound ${type}:`, error);
      return false;
    }
  };

  const processQueue = async () => {
    if (isProcessingQueue.current || soundQueue.current.length === 0) return;
    
    isProcessingQueue.current = true;
    
    try {
      while (soundQueue.current.length > 0) {
        const nextSound = soundQueue.current.shift();
        if (nextSound) {
          await playSound(nextSound);
          // Small delay between sounds to prevent overlap
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    } catch (error) {
      console.error('Sound queue processing error:', error);
    } finally {
      isProcessingQueue.current = false;
    }
  };

  const playSoundEffect = async (type: SoundType) => {
    // Debounce check
    const now = Date.now();
    if (lastPlayed[type] && now - (lastPlayed[type] as number) < DEBOUNCE_INTERVAL) {
      return;
    }
    
    setLastPlayed((prev) => ({ ...prev, [type]: now }));
    soundQueue.current.push(type);
    processQueue();
  };

  // Cleanup non-preloaded sounds on unmount
  useEffect(() => {
    return () => {
      activeSounds.current.forEach(async (sound) => {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (error) {
          console.warn('Error cleaning up sound:', error);
        }
      });
      activeSounds.current.clear();
    };
  }, []);

  return { playSoundEffect };
};
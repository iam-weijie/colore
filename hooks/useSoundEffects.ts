import { Audio } from 'expo-av';
import { useGlobalContext } from '../app/globalcontext'; // Corrected relative import path
import { useState, useEffect } from 'react';

// Define sound types/keys and their corresponding file paths
export enum SoundType {
  Tap = 'tap', // Keep tap for potential future use or other generic taps
  ToggleOn = 'toggleOn',
  ToggleOff = 'toggleOff',
  Like = 'like', // Add Like sound type
  Comment = 'comment', // Add Comment sound type
  // Add more sound types as needed
}

// NOTE: Ensure these sound files exist at the specified paths
const soundFiles = {
  [SoundType.Tap]: require('../assets/sounds/tap.mp3'),
  [SoundType.ToggleOn]: require('../assets/sounds/toggle.mp3'),
  [SoundType.ToggleOff]: require('../assets/sounds/toggle.mp3'),
  [SoundType.Like]: require('../assets/sounds/like.mp3'), // Map Like type to like.mp3
  [SoundType.Comment]: require('../assets/sounds/comment.mp3'), // Map Comment type to comment.mp3
  // Add more sound files
};

export const useSoundEffects = () => {
  const { soundEffectsEnabled } = useGlobalContext();
  const [soundObject, setSoundObject] = useState<Audio.Sound | null>(null);
  // State to track last played time for debouncing
  const [lastPlayed, setLastPlayed] = useState<{ [key in SoundType]?: number }>({});
  const DEBOUNCE_INTERVAL = 200; // milliseconds

  // Optional: Preload sounds if needed, or handle loading within playSoundEffect

  const playSoundEffect = async (type: SoundType) => {
    console.log(`[SoundEffect] Attempting to play type: ${type}`); // Log type attempt
    // Debounce check
    const now = Date.now();
    if (lastPlayed[type] && now - (lastPlayed[type] as number) < DEBOUNCE_INTERVAL) {
      console.log(`[SoundEffect] Debounced play for type: ${type}`);
      return; // Skip playing if called too recently
    }

    if (soundEffectsEnabled) {
      console.log(`[SoundEffect] Sound effects enabled. Proceeding for type: ${type}`); // Log enabled check
      let soundToPlay: Audio.Sound | null = null;
      try {
        // Unload previous sound if it exists and is different or if we want fresh playback
        // Unload previous sound if it exists and is different or if we want fresh playback
        if (soundObject) {
          console.log(`[SoundEffect] Attempting to unload previous sound object for type: ${type}`);
          try {
            await soundObject.unloadAsync(); // Wait for unload to complete
            console.log(`[SoundEffect] Previous sound object successfully unloaded for type: ${type}`);
            setSoundObject(null); // Set state to null *after* successful unload
          } catch (unloadError) {
            console.error(`[SoundEffect] Error unloading previous sound object for type ${type}:`, unloadError);
            setSoundObject(null); // Still set to null even if unload failed to prevent blocking
          }
        }

        const soundAsset = soundFiles[type];
        console.log(`[SoundEffect] Loading sound asset for type ${type}:`, soundAsset); // Log the asset path/module

        // Load the new sound with pitch correction enabled
        const { sound } = await Audio.Sound.createAsync(
          soundFiles[type]
          // Removed { shouldCorrectPitch: true }
        );
        console.log(`[SoundEffect] Sound loaded successfully for type: ${type}`); // Log successful load
        soundToPlay = sound;
        setSoundObject(sound);

        // Play the sound
        console.log(`[SoundEffect] Playing sound for type: ${type}`); // Log play attempt
        await sound.playAsync();
        console.log(`[SoundEffect] Sound playing initiated for type: ${type}`);
        // Update last played time after initiating playback
        setLastPlayed((prev) => ({ ...prev, [type]: Date.now() }));

        // Add listener to unload sound when finished playing
        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.isLoaded && status.didJustFinish) {
            console.log(`[SoundEffect] Sound finished playing and unloaded for type: ${type}`);
            // Check if the sound object still exists before unloading
            if (soundToPlay) {
              await soundToPlay.unloadAsync();
              // Only clear state if the finished sound is the one currently in state
              setSoundObject((currentSound) => (currentSound === soundToPlay ? null : currentSound));
            }
          } else if (status.isLoaded === false && status.error) {
            // Handle playback error if needed
            console.error(`[SoundEffect] Playback Error for type ${type}: ${status.error}`);
             if (soundToPlay) {
                await soundToPlay.unloadAsync().catch(() => {}); // Attempt unload, ignore errors
                setSoundObject((currentSound) => (currentSound === soundToPlay ? null : currentSound));
             }
          }
        });

      } catch (error) {
        console.error(`[SoundEffect] Failed to load/play sound effect for type ${type}:`, error); // Log specific error
        // Ensure sound object is cleared on error
         if (soundToPlay) {
            await soundToPlay.unloadAsync().catch(() => {}); // Attempt unload, ignore errors
            setSoundObject((currentSound) => (currentSound === soundToPlay ? null : currentSound));
         } else if (soundObject) {
            // Fallback cleanup if loading failed before assignment
            await soundObject.unloadAsync().catch(() => {});
            setSoundObject(null);
         }
      }
    } else {
      console.log(`[SoundEffect] Sound effects disabled. Skipping play for type: ${type}`); // Log disabled skip
    }
  };

   // Cleanup sound object on unmount
   useEffect(() => {
    return () => {
      if (soundObject) {
        // console.log('Unloading Sound on unmount');
        soundObject.unloadAsync().catch(() => {}); // Ignore errors on unmount cleanup
      }
    };
  }, [soundObject]); // Rerun effect if soundObject changes


  return { playSoundEffect };
};
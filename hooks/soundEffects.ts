// Export all sound-related hooks and components for easy access
export { useSoundEffects, SoundType } from './useSoundEffects';
export { useSoundScroll } from './useSoundScroll';
export { useSoundGesture } from './useSoundGesture';

// Export a utility function for playing one-off sound effects
import { SoundType, useSoundEffects } from './useSoundEffects';

/**
 * Helper function to determine appropriate sound type based on interaction
 * @param action The action being performed
 * @returns The appropriate SoundType
 */
export const getSoundTypeForAction = (action: string): SoundType => {
  switch (action.toLowerCase()) {
    case 'like':
    case 'favorite':
    case 'comment':
    case 'submit':
    case 'send':
    case 'delete':
    case 'remove':
      return SoundType.Delete;
    case 'success':
    case 'error':
    case 'fail':
    case 'navigation':
    case 'tab':
    case 'route':
      return SoundType.Navigation;
    case 'modal':
    case 'popup':
    case 'switch':
      return SoundType.ToggleOn;
    default:
      return SoundType.Button;
  }
}; 
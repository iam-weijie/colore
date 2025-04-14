import * as Haptics from 'expo-haptics';
import { useGlobalContext } from '../app/globalcontext'; // Corrected relative import path

export const useHaptics = () => {
  const { hapticsEnabled } = useGlobalContext();

  const triggerHaptic = (
    type: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType = Haptics.ImpactFeedbackStyle.Light
  ) => {
    if (hapticsEnabled) {
      if (Object.values(Haptics.ImpactFeedbackStyle).includes(type as Haptics.ImpactFeedbackStyle)) {
        Haptics.impactAsync(type as Haptics.ImpactFeedbackStyle);
      } else if (Object.values(Haptics.NotificationFeedbackType).includes(type as Haptics.NotificationFeedbackType)) {
        Haptics.notificationAsync(type as Haptics.NotificationFeedbackType);
      } else {
         Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Default fallback
      }
    }
  };

  return { triggerHaptic };
};
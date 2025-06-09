import AsyncStorage from '@react-native-async-storage/async-storage';

const TUTORIAL_CACHE_KEY_PREFIX = 'tutorial-step-';

export const tutorialCache = {

  async markCompleted(stepId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`${TUTORIAL_CACHE_KEY_PREFIX}${stepId}`, 'true');
    } catch (error) {
      console.error('Failed to mark tutorial step as completed:', error);
    }
  },


  async isCompleted(stepId: string): Promise<boolean> {
    try {
      const result = await AsyncStorage.getItem(`${TUTORIAL_CACHE_KEY_PREFIX}${stepId}`);
      return result === 'true';
    } catch (error) {
      console.error('Failed to check if tutorial step is completed:', error);
      return false;
    }
  },


  async clearStep(stepId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${TUTORIAL_CACHE_KEY_PREFIX}${stepId}`);
    } catch (error) {
      console.error('Failed to clear tutorial step:', error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const tutorialKeys = keys.filter(key => key.startsWith(TUTORIAL_CACHE_KEY_PREFIX));
      await AsyncStorage.multiRemove(tutorialKeys);
    } catch (error) {
      console.error('Failed to clear all tutorial steps:', error);
    }
  },
};

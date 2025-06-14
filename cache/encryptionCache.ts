import AsyncStorage from '@react-native-async-storage/async-storage';

const ENCRYPTION_KEY_STORAGE = 'encryptionKey';

export const encryptionCache = {
  async setDerivedKey(key: string): Promise<void> {
    try {
      await AsyncStorage.setItem(ENCRYPTION_KEY_STORAGE, key);
      console.log('[DEBUG] EncryptionCache - Stored encryption key');
    } catch (error) {
      console.error('[DEBUG] EncryptionCache - Failed to store encryption key:', error);
    }
  },

  async getDerivedKey(): Promise<string | null> {
    try {
      const key = await AsyncStorage.getItem(ENCRYPTION_KEY_STORAGE);
      return key;
    } catch (error) {
      console.error('[DEBUG] EncryptionCache - Failed to retrieve encryption key:', error);
      return null;
    }
  },

  async clearKey(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ENCRYPTION_KEY_STORAGE);
      console.log('[DEBUG] EncryptionCache - Cleared encryption key');
    } catch (error) {
      console.error('[DEBUG] EncryptionCache - Failed to clear encryption key:', error);
    }
  },
}; 

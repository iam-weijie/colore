import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_KEY_STORAGE_KEY = 'derived-encryption-key';

export const encryptionCache = {
  /**
   * Save the derived encryption key securely on device
   */
  async setDerivedKey(key: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ENCRYPTION_KEY_STORAGE_KEY, key);
    } catch (error) {
      console.error('Failed to store derived encryption key:', error);
    }
  },

  /**
   * Retrieve the derived encryption key from secure storage
   */
  async getDerivedKey(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ENCRYPTION_KEY_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to retrieve derived encryption key:', error);
      return null;
    }
  },

  /**
   * Delete the stored encryption key (e.g. on logout)
   */
  async clearDerivedKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ENCRYPTION_KEY_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to delete derived encryption key:', error);
    }
  },
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SHORTHAND_EMOJIS } from '@/constants/emojiLibrary';

/**
 * Utility functions for managing user emoji preferences in device storage
 * Each user has their own emoji preferences stored with their user ID as key
 */

export class EmojiStorage {
  private static getStorageKey(userId: string): string {
    return `shorthand_emojis_${userId}`;
  }

  /**
   * Get user's shorthand emojis from device storage
   * @param userId - The user's clerk ID
   * @returns Array of 6 emoji strings or default emojis if none saved
   */
  static async getUserShorthandEmojis(userId: string): Promise<string[]> {
    try {
      const storageKey = this.getStorageKey(userId);
      const storedEmojis = await AsyncStorage.getItem(storageKey);
      
      if (storedEmojis) {
        const parsedEmojis = JSON.parse(storedEmojis);
        if (Array.isArray(parsedEmojis) && parsedEmojis.length === 6) {
          return parsedEmojis;
        }
      }
      
      // Return default emojis if none stored or invalid data
      return DEFAULT_SHORTHAND_EMOJIS;
    } catch (error) {
      console.error('Failed to get user shorthand emojis:', error);
      return DEFAULT_SHORTHAND_EMOJIS;
    }
  }

  /**
   * Save user's shorthand emojis to device storage
   * @param userId - The user's clerk ID
   * @param emojis - Array of exactly 6 emoji strings
   * @returns Promise<boolean> - Success status
   */
  static async saveUserShorthandEmojis(userId: string, emojis: string[]): Promise<boolean> {
    try {
      if (!Array.isArray(emojis) || emojis.length !== 6) {
        throw new Error('Emojis must be an array of exactly 6 strings');
      }

      const storageKey = this.getStorageKey(userId);
      await AsyncStorage.setItem(storageKey, JSON.stringify(emojis));
      return true;
    } catch (error) {
      console.error('Failed to save user shorthand emojis:', error);
      return false;
    }
  }

  /**
   * Reset user's shorthand emojis to default
   * @param userId - The user's clerk ID
   * @returns Promise<boolean> - Success status
   */
  static async resetUserShorthandEmojis(userId: string): Promise<boolean> {
    try {
      return await this.saveUserShorthandEmojis(userId, DEFAULT_SHORTHAND_EMOJIS);
    } catch (error) {
      console.error('Failed to reset user shorthand emojis:', error);
      return false;
    }
  }

  /**
   * Remove user's emoji preferences from storage
   * @param userId - The user's clerk ID
   * @returns Promise<boolean> - Success status
   */
  static async removeUserShorthandEmojis(userId: string): Promise<boolean> {
    try {
      const storageKey = this.getStorageKey(userId);
      await AsyncStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error('Failed to remove user shorthand emojis:', error);
      return false;
    }
  }

  /**
   * Check if user has custom emoji preferences saved
   * @param userId - The user's clerk ID
   * @returns Promise<boolean> - True if user has custom emojis saved
   */
  static async hasCustomEmojis(userId: string): Promise<boolean> {
    try {
      const storageKey = this.getStorageKey(userId);
      const storedEmojis = await AsyncStorage.getItem(storageKey);
      return storedEmojis !== null;
    } catch (error) {
      console.error('Failed to check for custom emojis:', error);
      return false;
    }
  }

  /**
   * Check if stored emojis are valid (array of 6 strings)
   * @param userId - The user's clerk ID
   * @returns Promise<boolean> - True if stored emojis are valid
   */
  static async hasValidEmojis(userId: string): Promise<boolean> {
    try {
      const emojis = await this.getUserShorthandEmojis(userId);
      return Array.isArray(emojis) && emojis.length === 6;
    } catch (error) {
      console.error('Failed to check emoji validity:', error);
      return false;
    }
  }

  /**
   * Get storage status for debugging
   * @param userId - The user's clerk ID
   * @returns Promise<{hasStorage: boolean, isValid: boolean, emojis: string[] | null}>
   */
  static async getStorageStatus(userId: string): Promise<{
    hasStorage: boolean;
    isValid: boolean;
    emojis: string[] | null;
  }> {
    try {
      const storageKey = this.getStorageKey(userId);
      const storedEmojis = await AsyncStorage.getItem(storageKey);
      const hasStorage = storedEmojis !== null;
      
      if (!hasStorage) {
        return { hasStorage: false, isValid: false, emojis: null };
      }

      const parsedEmojis = JSON.parse(storedEmojis);
      const isValid = Array.isArray(parsedEmojis) && parsedEmojis.length === 6;
      
      return {
        hasStorage: true,
        isValid,
        emojis: isValid ? parsedEmojis : null
      };
    } catch (error) {
      console.error('Failed to get storage status:', error);
      return { hasStorage: false, isValid: false, emojis: null };
    }
  }

  /**
   * Get all stored emoji preferences (for debugging or migration)
   * @returns Promise<Record<string, string[]>> - Object with userId as key and emojis as value
   */
  static async getAllEmojiPreferences(): Promise<Record<string, string[]>> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const emojiKeys = allKeys.filter(key => key.startsWith('shorthand_emojis_'));
      const preferences: Record<string, string[]> = {};

      for (const key of emojiKeys) {
        const userId = key.replace('shorthand_emojis_', '');
        const emojis = await this.getUserShorthandEmojis(userId);
        preferences[userId] = emojis;
      }

      return preferences;
    } catch (error) {
      console.error('Failed to get all emoji preferences:', error);
      return {};
    }
  }
}

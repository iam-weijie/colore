"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmojiStorage = void 0;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const emojiLibrary_1 = require("@/constants/emojiLibrary");
/**
 * Utility functions for managing user emoji preferences in device storage
 * Each user has their own emoji preferences stored with their user ID as key
 */
class EmojiStorage {
    static getStorageKey(userId) {
        return `shorthand_emojis_${userId}`;
    }
    /**
     * Get user's shorthand emojis from device storage
     * @param userId - The user's clerk ID
     * @returns Array of 6 emoji strings or default emojis if none saved
     */
    static async getUserShorthandEmojis(userId) {
        try {
            const storageKey = this.getStorageKey(userId);
            const storedEmojis = await async_storage_1.default.getItem(storageKey);
            if (storedEmojis) {
                const parsedEmojis = JSON.parse(storedEmojis);
                if (Array.isArray(parsedEmojis) && parsedEmojis.length === 6) {
                    return parsedEmojis;
                }
            }
            // Return default emojis if none stored or invalid data
            return emojiLibrary_1.DEFAULT_SHORTHAND_EMOJIS;
        }
        catch (error) {
            console.error('Failed to get user shorthand emojis:', error);
            return emojiLibrary_1.DEFAULT_SHORTHAND_EMOJIS;
        }
    }
    /**
     * Save user's shorthand emojis to device storage
     * @param userId - The user's clerk ID
     * @param emojis - Array of exactly 6 emoji strings
     * @returns Promise<boolean> - Success status
     */
    static async saveUserShorthandEmojis(userId, emojis) {
        try {
            if (!Array.isArray(emojis) || emojis.length !== 6) {
                throw new Error('Emojis must be an array of exactly 6 strings');
            }
            const storageKey = this.getStorageKey(userId);
            await async_storage_1.default.setItem(storageKey, JSON.stringify(emojis));
            return true;
        }
        catch (error) {
            console.error('Failed to save user shorthand emojis:', error);
            return false;
        }
    }
    /**
     * Reset user's shorthand emojis to default
     * @param userId - The user's clerk ID
     * @returns Promise<boolean> - Success status
     */
    static async resetUserShorthandEmojis(userId) {
        try {
            return await this.saveUserShorthandEmojis(userId, emojiLibrary_1.DEFAULT_SHORTHAND_EMOJIS);
        }
        catch (error) {
            console.error('Failed to reset user shorthand emojis:', error);
            return false;
        }
    }
    /**
     * Remove user's emoji preferences from storage
     * @param userId - The user's clerk ID
     * @returns Promise<boolean> - Success status
     */
    static async removeUserShorthandEmojis(userId) {
        try {
            const storageKey = this.getStorageKey(userId);
            await async_storage_1.default.removeItem(storageKey);
            return true;
        }
        catch (error) {
            console.error('Failed to remove user shorthand emojis:', error);
            return false;
        }
    }
    /**
     * Check if user has custom emoji preferences saved
     * @param userId - The user's clerk ID
     * @returns Promise<boolean> - True if user has custom emojis saved
     */
    static async hasCustomEmojis(userId) {
        try {
            const storageKey = this.getStorageKey(userId);
            const storedEmojis = await async_storage_1.default.getItem(storageKey);
            return storedEmojis !== null;
        }
        catch (error) {
            console.error('Failed to check for custom emojis:', error);
            return false;
        }
    }
    /**
     * Get all stored emoji preferences (for debugging or migration)
     * @returns Promise<Record<string, string[]>> - Object with userId as key and emojis as value
     */
    static async getAllEmojiPreferences() {
        try {
            const allKeys = await async_storage_1.default.getAllKeys();
            const emojiKeys = allKeys.filter(key => key.startsWith('shorthand_emojis_'));
            const preferences = {};
            for (const key of emojiKeys) {
                const userId = key.replace('shorthand_emojis_', '');
                const emojis = await this.getUserShorthandEmojis(userId);
                preferences[userId] = emojis;
            }
            return preferences;
        }
        catch (error) {
            console.error('Failed to get all emoji preferences:', error);
            return {};
        }
    }
}
exports.EmojiStorage = EmojiStorage;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentEmojiStorage = void 0;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
/**
 * Utility functions for managing recently used emojis
 * Tracks the last 6 emojis used by each user, separate from saved preferences
 */
class RecentEmojiStorage {
    static getStorageKey(userId) {
        return `recent_emojis_${userId}`;
    }
    /**
     * Get user's recently used emojis
     * @param userId - The user's clerk ID
     * @returns Array of up to 6 recently used emoji strings
     */
    static async getRecentEmojis(userId) {
        try {
            const storageKey = this.getStorageKey(userId);
            const storedEmojis = await async_storage_1.default.getItem(storageKey);
            if (storedEmojis) {
                const parsedEmojis = JSON.parse(storedEmojis);
                if (Array.isArray(parsedEmojis)) {
                    return parsedEmojis.slice(0, 6); // Ensure max 6 emojis
                }
            }
            return [];
        }
        catch (error) {
            console.error('Failed to get recent emojis:', error);
            return [];
        }
    }
    /**
     * Add an emoji to the recent list (moves to front, removes duplicates)
     * @param userId - The user's clerk ID
     * @param emoji - The emoji string to add
     * @returns Promise<boolean> - Success status
     */
    static async addRecentEmoji(userId, emoji) {
        try {
            const currentRecent = await this.getRecentEmojis(userId);
            // Remove emoji if it already exists
            const filteredRecent = currentRecent.filter(e => e !== emoji);
            // Add emoji to the front
            const newRecent = [emoji, ...filteredRecent].slice(0, 6);
            const storageKey = this.getStorageKey(userId);
            await async_storage_1.default.setItem(storageKey, JSON.stringify(newRecent));
            return true;
        }
        catch (error) {
            console.error('Failed to add recent emoji:', error);
            return false;
        }
    }
    /**
     * Clear all recent emojis for a user
     * @param userId - The user's clerk ID
     * @returns Promise<boolean> - Success status
     */
    static async clearRecentEmojis(userId) {
        try {
            const storageKey = this.getStorageKey(userId);
            await async_storage_1.default.removeItem(storageKey);
            return true;
        }
        catch (error) {
            console.error('Failed to clear recent emojis:', error);
            return false;
        }
    }
    /**
     * Check if user has any recent emojis
     * @param userId - The user's clerk ID
     * @returns Promise<boolean> - True if user has recent emojis
     */
    static async hasRecentEmojis(userId) {
        try {
            const recentEmojis = await this.getRecentEmojis(userId);
            return recentEmojis.length > 0;
        }
        catch (error) {
            console.error('Failed to check for recent emojis:', error);
            return false;
        }
    }
}
exports.RecentEmojiStorage = RecentEmojiStorage;

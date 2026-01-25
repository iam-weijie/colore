import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { EmojiStorage } from '@/lib/emojiStorage';
import { DEFAULT_SHORTHAND_EMOJIS } from '@/constants/emojiLibrary';

/**
 * Custom hook for managing user emoji preferences
 * Automatically loads and manages emoji preferences for the current user
 */
export const useEmojiPreferences = () => {
  const { user } = useUser();
  const [shorthandEmojis, setShorthandEmojis] = useState<string[]>(DEFAULT_SHORTHAND_EMOJIS);
  const [loading, setLoading] = useState(false);
  const [hasCustomEmojis, setHasCustomEmojis] = useState(false);

  // Load user's emoji preferences when user changes
  useEffect(() => {
    if (user?.id) {
      loadEmojiPreferences();
    }
  }, [user?.id]);

  const loadEmojiPreferences = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [emojis, hasCustom] = await Promise.all([
        EmojiStorage.getUserShorthandEmojis(user.id),
        EmojiStorage.hasCustomEmojis(user.id)
      ]);
      
      setShorthandEmojis(emojis);
      setHasCustomEmojis(hasCustom);
    } catch (error) {
      console.error('Failed to load emoji preferences:', error);
      setShorthandEmojis(DEFAULT_SHORTHAND_EMOJIS);
      setHasCustomEmojis(false);
    } finally {
      setLoading(false);
    }
  };

  const saveEmojiPreferences = async (emojis: string[]): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await EmojiStorage.saveUserShorthandEmojis(user.id, emojis);
      if (success) {
        setShorthandEmojis(emojis);
        setHasCustomEmojis(true);
      }
      return success;
    } catch (error) {
      console.error('Failed to save emoji preferences:', error);
      return false;
    }
  };

  const resetEmojiPreferences = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await EmojiStorage.resetUserShorthandEmojis(user.id);
      if (success) {
        setShorthandEmojis(DEFAULT_SHORTHAND_EMOJIS);
        setHasCustomEmojis(true); // Still has custom (default) saved
      }
      return success;
    } catch (error) {
      console.error('Failed to reset emoji preferences:', error);
      return false;
    }
  };

  const clearEmojiPreferences = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await EmojiStorage.removeUserShorthandEmojis(user.id);
      if (success) {
        setShorthandEmojis(DEFAULT_SHORTHAND_EMOJIS);
        setHasCustomEmojis(false);
      }
      return success;
    } catch (error) {
      console.error('Failed to clear emoji preferences:', error);
      return false;
    }
  };

  const refreshEmojiPreferences = () => {
    loadEmojiPreferences();
  };

  return {
    shorthandEmojis,
    loading,
    hasCustomEmojis,
    saveEmojiPreferences,
    resetEmojiPreferences,
    clearEmojiPreferences,
    refreshEmojiPreferences
  };
};

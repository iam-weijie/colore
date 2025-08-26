import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { EmojiStorage } from '@/lib/emojiStorage';
import { DEFAULT_SHORTHAND_EMOJIS } from '@/constants/emojiLibrary';

/**
 * Custom hook for managing user emoji preferences
 * Automatically loads and manages emoji preferences for the current user
 * Saves preferences to both device storage and database
 */
export const useEmojiPreferences = () => {
  const { user } = useUser();
  const [shorthandEmojis, setShorthandEmojis] = useState<string[]>(DEFAULT_SHORTHAND_EMOJIS);
  const [loading, setLoading] = useState(false);
  const [hasCustomEmojis, setHasCustomEmojis] = useState(false);

  const loadEmojiPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // First try to load from device storage
      const [deviceEmojis, hasCustom] = await Promise.all([
        EmojiStorage.getUserShorthandEmojis(user.id),
        EmojiStorage.hasCustomEmojis(user.id)
      ]);
      
      // If device has custom emojis, use them
      if (hasCustom) {
        setShorthandEmojis(deviceEmojis);
        setHasCustomEmojis(true);
      } else {
        // Try to load from database as fallback
        try {
          const dbEmojis = await loadFromDatabase(user.id);
          if (dbEmojis && Array.isArray(dbEmojis) && dbEmojis.length === 6) {
            // Save to device storage for future use
            await EmojiStorage.saveUserShorthandEmojis(user.id, dbEmojis);
            setShorthandEmojis(dbEmojis);
            setHasCustomEmojis(true);
          } else {
            // Use device defaults
            setShorthandEmojis(deviceEmojis);
            setHasCustomEmojis(false);
          }
        } catch (dbError) {
          console.warn('Failed to load from database, using device defaults:', dbError);
          setShorthandEmojis(deviceEmojis);
          setHasCustomEmojis(false);
        }
      }
    } catch (error) {
      console.error('Failed to load emoji preferences:', error);
      setShorthandEmojis(DEFAULT_SHORTHAND_EMOJIS);
      setHasCustomEmojis(false);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load user's emoji preferences when user changes
  useEffect(() => {
    if (user?.id) {
      loadEmojiPreferences();
    }
  }, [user?.id, loadEmojiPreferences]);

  const loadFromDatabase = useCallback(async (clerkId: string): Promise<string[] | null> => {
    try {
      const response = await fetch(`/api/users/updateEmojiPreferences?clerkId=${clerkId}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.data?.shorthandEmojis || null;
    } catch (error) {
      console.error('Failed to load from database:', error);
      return null;
    }
  }, []);

  const saveToDatabase = useCallback(async (clerkId: string, emojis: string[] | null): Promise<boolean> => {
    try {
      const response = await fetch('/api/users/updateEmojiPreferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId,
          shorthandEmojis: emojis
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Database save failed:', errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to save to database:', error);
      return false;
    }
  }, []);

  const saveEmojiPreferences = useCallback(async (emojis: string[]): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Save to both device storage and database
      const [deviceSuccess, databaseSuccess] = await Promise.allSettled([
        EmojiStorage.saveUserShorthandEmojis(user.id, emojis),
        saveToDatabase(user.id, emojis)
      ]);

      // Check results
      const deviceOk = deviceSuccess.status === 'fulfilled' && deviceSuccess.value;
      const databaseOk = databaseSuccess.status === 'fulfilled' && databaseSuccess.value;

      if (deviceOk && databaseOk) {
        // Both succeeded
        setShorthandEmojis(emojis);
        setHasCustomEmojis(true);
        return true;
      } else if (deviceOk) {
        // Only device succeeded - still update UI but log warning
        console.warn('Emojis saved to device but failed to save to database');
        setShorthandEmojis(emojis);
        setHasCustomEmojis(true);
        return true;
      } else if (databaseOk) {
        // Only database succeeded - still update UI but log warning
        console.warn('Emojis saved to database but failed to save to device');
        setShorthandEmojis(emojis);
        setHasCustomEmojis(true);
        return true;
      } else {
        // Both failed
        console.error('Failed to save emojis to both device and database');
        return false;
      }
    } catch (error) {
      console.error('Failed to save emoji preferences:', error);
      return false;
    }
  }, [user?.id, saveToDatabase]);

  const resetEmojiPreferences = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Reset in both device storage and database
      const [deviceSuccess, databaseSuccess] = await Promise.allSettled([
        EmojiStorage.resetUserShorthandEmojis(user.id),
        saveToDatabase(user.id, DEFAULT_SHORTHAND_EMOJIS)
      ]);

      // Check results
      const deviceOk = deviceSuccess.status === 'fulfilled' && deviceSuccess.value;
      const databaseOk = databaseSuccess.status === 'fulfilled' && databaseSuccess.value;

      if (deviceOk || databaseOk) {
        // At least one succeeded
        setShorthandEmojis(DEFAULT_SHORTHAND_EMOJIS);
        setHasCustomEmojis(true); // Still has custom (default) saved
        return true;
      } else {
        // Both failed
        console.error('Failed to reset emojis in both device and database');
        return false;
      }
    } catch (error) {
      console.error('Failed to reset emoji preferences:', error);
      return false;
    }
  }, [user?.id, saveToDatabase]);

  const clearEmojiPreferences = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Clear from both device storage and database
      const [deviceSuccess, databaseSuccess] = await Promise.allSettled([
        EmojiStorage.removeUserShorthandEmojis(user.id),
        saveToDatabase(user.id, null) // Set to null in database
      ]);

      // Check results
      const deviceOk = deviceSuccess.status === 'fulfilled' && deviceSuccess.value;
      const databaseOk = databaseSuccess.status === 'fulfilled' && databaseSuccess.value;

      if (deviceOk || databaseOk) {
        // At least one succeeded
        setShorthandEmojis(DEFAULT_SHORTHAND_EMOJIS);
        setHasCustomEmojis(false);
        return true;
      } else {
        // Both failed
        console.error('Failed to clear emojis from both device and database');
        return false;
      }
    } catch (error) {
      console.error('Failed to clear emoji preferences:', error);
      return false;
    }
  }, [user?.id, saveToDatabase]);

  const refreshEmojiPreferences = useCallback(() => {
    loadEmojiPreferences();
  }, [loadEmojiPreferences]);

  const syncEmojiPreferences = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Get current device emojis
      const deviceEmojis = await EmojiStorage.getUserShorthandEmojis(user.id);
      const hasCustom = await EmojiStorage.hasCustomEmojis(user.id);
      
      if (!hasCustom) {
        // No custom emojis on device, try to load from database
        const dbEmojis = await loadFromDatabase(user.id);
        if (dbEmojis && Array.isArray(dbEmojis) && dbEmojis.length === 6) {
          await EmojiStorage.saveUserShorthandEmojis(user.id, dbEmojis);
          setShorthandEmojis(dbEmojis);
          setHasCustomEmojis(true);
          return true;
        }
        return false;
      }

      // Device has custom emojis, sync to database
      const success = await saveToDatabase(user.id, deviceEmojis);
      if (success) {
        console.log('Successfully synced emoji preferences to database');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to sync emoji preferences:', error);
      return false;
    }
  }, [user?.id, loadFromDatabase, saveToDatabase]);

  return {
    shorthandEmojis,
    loading,
    hasCustomEmojis,
    saveEmojiPreferences,
    resetEmojiPreferences,
    clearEmojiPreferences,
    refreshEmojiPreferences,
    syncEmojiPreferences
  };
};

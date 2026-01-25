import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { RecentEmojiStorage } from '@/lib/recentEmojiStorage';

/**
 * Custom hook for managing recently used emojis
 * Automatically loads and manages recent emojis for the current user
 */
export const useRecentEmojis = () => {
  const { user } = useUser();
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user's recent emojis when user changes
  useEffect(() => {
    if (user?.id) {
      loadRecentEmojis();
    }
  }, [user?.id]);

  const loadRecentEmojis = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const emojis = await RecentEmojiStorage.getRecentEmojis(user.id);
      setRecentEmojis(emojis);
    } catch (error) {
      console.error('Failed to load recent emojis:', error);
      setRecentEmojis([]);
    } finally {
      setLoading(false);
    }
  };

  const addRecentEmoji = async (emoji: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await RecentEmojiStorage.addRecentEmoji(user.id, emoji);
      if (success) {
        // Update local state immediately
        setRecentEmojis(prev => {
          const filtered = prev.filter(e => e !== emoji);
          return [emoji, ...filtered].slice(0, 6);
        });
      }
      return success;
    } catch (error) {
      console.error('Failed to add recent emoji:', error);
      return false;
    }
  };

  const clearRecentEmojis = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await RecentEmojiStorage.clearRecentEmojis(user.id);
      if (success) {
        setRecentEmojis([]);
      }
      return success;
    } catch (error) {
      console.error('Failed to clear recent emojis:', error);
      return false;
    }
  };

  const refreshRecentEmojis = () => {
    loadRecentEmojis();
  };

  return {
    recentEmojis,
    loading,
    hasRecentEmojis: recentEmojis.length > 0,
    addRecentEmoji,
    clearRecentEmojis,
    refreshRecentEmojis
  };
};

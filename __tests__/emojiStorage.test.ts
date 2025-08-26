import { EmojiStorage } from '@/lib/emojiStorage';
import { DEFAULT_SHORTHAND_EMOJIS } from '@/constants/emojiLibrary';

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

describe('EmojiStorage', () => {
  const testUserId = 'test-user-123';
  const testEmojis = ['😊', '❤️', '👍', '😂', '🔥', '🥳'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserShorthandEmojis', () => {
    it('should return stored emojis when valid', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(testEmojis));
      
      const result = await EmojiStorage.getUserShorthandEmojis(testUserId);
      
      expect(result).toEqual(testEmojis);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(`shorthand_emojis_${testUserId}`);
    });

    it('should return default emojis when no storage', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      const result = await EmojiStorage.getUserShorthandEmojis(testUserId);
      
      expect(result).toEqual(DEFAULT_SHORTHAND_EMOJIS);
    });

    it('should return default emojis when invalid data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid-json');
      
      const result = await EmojiStorage.getUserShorthandEmojis(testUserId);
      
      expect(result).toEqual(DEFAULT_SHORTHAND_EMOJIS);
    });

    it('should return default emojis when wrong array length', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(['😊', '❤️']));
      
      const result = await EmojiStorage.getUserShorthandEmojis(testUserId);
      
      expect(result).toEqual(DEFAULT_SHORTHAND_EMOJIS);
    });
  });

  describe('saveUserShorthandEmojis', () => {
    it('should save valid emojis successfully', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      
      const result = await EmojiStorage.saveUserShorthandEmojis(testUserId, testEmojis);
      
      expect(result).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        `shorthand_emojis_${testUserId}`,
        JSON.stringify(testEmojis)
      );
    });

    it('should reject invalid emoji array length', async () => {
      const invalidEmojis = ['😊', '❤️'];
      
      const result = await EmojiStorage.saveUserShorthandEmojis(testUserId, invalidEmojis);
      
      expect(result).toBe(false);
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should reject non-array input', async () => {
      const result = await EmojiStorage.saveUserShorthandEmojis(testUserId, 'invalid' as any);
      
      expect(result).toBe(false);
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('resetUserShorthandEmojis', () => {
    it('should reset to default emojis successfully', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      
      const result = await EmojiStorage.resetUserShorthandEmojis(testUserId);
      
      expect(result).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        `shorthand_emojis_${testUserId}`,
        JSON.stringify(DEFAULT_SHORTHAND_EMOJIS)
      );
    });
  });

  describe('removeUserShorthandEmojis', () => {
    it('should remove emojis successfully', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);
      
      const result = await EmojiStorage.removeUserShorthandEmojis(testUserId);
      
      expect(result).toBe(true);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(`shorthand_emojis_${testUserId}`);
    });
  });

  describe('hasCustomEmojis', () => {
    it('should return true when custom emojis exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(testEmojis));
      
      const result = await EmojiStorage.hasCustomEmojis(testUserId);
      
      expect(result).toBe(true);
    });

    it('should return false when no custom emojis', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      const result = await EmojiStorage.hasCustomEmojis(testUserId);
      
      expect(result).toBe(false);
    });
  });

  describe('getStorageStatus', () => {
    it('should return correct status for valid emojis', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(testEmojis));
      
      const result = await EmojiStorage.getStorageStatus(testUserId);
      
      expect(result).toEqual({
        hasStorage: true,
        isValid: true,
        emojis: testEmojis
      });
    });

    it('should return correct status for invalid emojis', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(['😊']));
      
      const result = await EmojiStorage.getStorageStatus(testUserId);
      
      expect(result).toEqual({
        hasStorage: true,
        isValid: false,
        emojis: null
      });
    });

    it('should return correct status for no storage', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      const result = await EmojiStorage.getStorageStatus(testUserId);
      
      expect(result).toEqual({
        hasStorage: false,
        isValid: false,
        emojis: null
      });
    });
  });
});

/**
 * In-memory cache for decrypted data to avoid redundant decryption operations
 * This cache is cleared on logout for security
 */

const decryptionCache = new Map<string, string>();

export const getDecryptedValue = (ciphertext: string): string | undefined => {
  return decryptionCache.get(ciphertext);
};

export const setDecryptedValue = (ciphertext: string, plaintext: string): void => {
  decryptionCache.set(ciphertext, plaintext);
};

export const clearDecryptionCache = (): void => {
  decryptionCache.clear();
};

export const getCacheSize = (): number => {
  return decryptionCache.size;
};

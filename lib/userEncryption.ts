import { decryptText, encryptText } from "@/lib/encryption";
import { UserProfileType } from "@/types/type";

/**
 * Utility functions for handling user data encryption/decryption
 */

/**
 * Decrypt user identity fields if they are encrypted
 * @param userData - User data from the API
 * @param encryptionKey - The user's encryption key
 * @returns User data with decrypted identity fields
 */
export const decryptUserIdentityFields = (
  userData: UserProfileType,
  encryptionKey: string
): UserProfileType => {
  const decryptedData = { ...userData };

  // If encrypted fields exist, use them; otherwise fall back to plaintext
  if (userData.username_encrypted) {
    decryptedData.username = decryptText(userData.username_encrypted, encryptionKey);
  }
  
  if (userData.nickname_encrypted) {
    decryptedData.nickname = decryptText(userData.nickname_encrypted, encryptionKey);
  }

  // incognito_name is now always plaintext, just pass it through
  // (no decryption needed)

  return decryptedData;
};

/**
 * Encrypt user identity fields for sending to the API
 * @param identityData - Object containing identity fields to encrypt
 * @param encryptionKey - The user's encryption key
 * @returns Object with encrypted identity fields
 */
export const encryptUserIdentityFields = (
  identityData: {
    username?: string;
    nickname?: string;
    // incognito_name is now always plaintext, do not encrypt
  },
  encryptionKey: string
): {
  username_encrypted?: string;
  nickname_encrypted?: string;
  // incognito_name_encrypted removed
} => {
  const encryptedData: {
    username_encrypted?: string;
    nickname_encrypted?: string;
  } = {};

  if (identityData.username !== undefined && identityData.username !== null) {
    encryptedData.username_encrypted = encryptText(identityData.username, encryptionKey);
  }
  
  if (identityData.nickname !== undefined && identityData.nickname !== null) {
    encryptedData.nickname_encrypted = encryptText(identityData.nickname, encryptionKey);
  }

  // incognito_name is not encrypted

  return encryptedData;
};

/**
 * Check if user needs migration (has no encrypted fields but has plaintext fields)
 * @param userData - User data from the API
 * @returns true if migration is needed
 */
export const userNeedsMigration = (userData: UserProfileType): boolean => {
  return (
    !userData.username_encrypted &&
    !userData.nickname_encrypted &&
    !!(userData.username || userData.nickname)
    // incognito_name is always plaintext, so not checked for migration
  );
};

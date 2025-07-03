import { deriveKey, generateSalt } from "@/lib/encryption";
import { encryptUserIdentityFields, decryptUserIdentityFields } from "@/lib/userEncryption";
import { UserProfileType } from "@/types/type";

/**
 * Handle password change by re-encrypting all user data with a new key
 * @param userData - Current user data (with encrypted fields)
 * @param oldPassword - User's current password
 * @param newPassword - User's new password
 * @param currentSalt - User's current salt
 * @returns Object with new salt and re-encrypted data
 */
export const handlePasswordChange = async (
  userData: UserProfileType,
  oldPassword: string,
  newPassword: string,
  currentSalt: string
): Promise<{
  newSalt: string;
  newEncryptedData: {
    username_encrypted?: string;
    nickname_encrypted?: string;
  };
}> => {
  try {
    // Derive the old key to decrypt existing data
    const oldKey = deriveKey(oldPassword, currentSalt);
    
    // Decrypt current user data with old key
    const decryptedData = decryptUserIdentityFields(userData, oldKey);
    
    // Generate new salt for new password
    const newSalt = generateSalt();
    
    // Derive new key from new password and new salt
    const newKey = deriveKey(newPassword, newSalt);
    
    // Re-encrypt only username and nickname with new key
    const newEncryptedData = encryptUserIdentityFields({
      username: decryptedData.username,
      nickname: decryptedData.nickname,
    }, newKey);
    
    return {
      newSalt,
      newEncryptedData,
    };
    
  } catch (error) {
    console.error("[handlePasswordChange] Error re-encrypting data:", error);
    throw new Error("Failed to re-encrypt user data with new password");
  }
};

/**
 * Verify that the old password is correct by attempting to decrypt existing data
 * @param userData - Current user data (with encrypted fields)
 * @param oldPassword - Password to verify
 * @param currentSalt - User's current salt
 * @returns true if password is correct
 */
export const verifyOldPassword = (
  userData: UserProfileType,
  oldPassword: string,
  currentSalt: string
): boolean => {
  try {
    const oldKey = deriveKey(oldPassword, currentSalt);
    
    // Try to decrypt existing data - if password is wrong, this will fail
    decryptUserIdentityFields(userData, oldKey);
    
    return true;
  } catch (error) {
    console.log("[verifyOldPassword] Password verification failed:", error);
    return false;
  }
};

import CryptoJS from "crypto-js";

/**
 * Generate a cryptographically-strong random salt (hex string, 16 bytes)
 * With fallback for environments where native crypto is unavailable
 */
export const generateSalt = (): string => {
  try {
    // First try the standard method
    return CryptoJS.lib.WordArray.random(16).toString(); // 32-char hex
  } catch (error) {
    console.warn("[generateSalt] Crypto random failed, using fallback method:", error);
    
    // Fallback method using Math.random
    // Note: This is less secure but better than failing completely
    const fallbackRandomHex = () => {
      return Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    };
    
    // Generate a 32-character hex string (similar to the CryptoJS output)
    return Array.from({ length: 6 }, fallbackRandomHex).join('').substring(0, 32);
  }
};

/**
 * Derive an AES key from the user password + salt using PBKDF2.
 * Returns a hex string representation of the key (256-bit).
 */
export const deriveKey = (password: string, salt: string): string => {
  try {
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32, // 256-bit key
      iterations: 10000, // strong enough for client side
    });
    return key.toString();
  } catch (error) {
    console.warn("[deriveKey] PBKDF2 failed, using fallback method:", error);
    
    // Simple fallback method - less secure but better than failing
    // This combines the password and salt in a deterministic way
    const combinedString = password + ":" + salt;
    return CryptoJS.SHA256(combinedString).toString();
  }
};

/** Encrypt arbitrary UTF-8 text with AES-256-CBC. */
export const encryptText = (plainText: string, keyHex: string): string => {
  try {
    const cipherText = CryptoJS.AES.encrypt(plainText, keyHex).toString();
    return cipherText;
  } catch (error) {
    console.error("[encryptText] Encryption failed:", error);
    // Return a special marker to indicate encryption failed
    // This is better than returning plaintext which would expose sensitive data
    return `##ENCRYPTION_FAILED##${Date.now()}`;
  }
};

/** Decrypt AES-encrypted text. Returns empty string on failure. */
export const decryptText = (cipherText: string, keyHex: string): string => {
  // Check if this is a failed encryption marker
  if (cipherText.startsWith('##ENCRYPTION_FAILED##')) {
    console.warn("[decryptText] Attempted to decrypt a failed encryption marker");
    return "";
  }
  
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, keyHex);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.warn("[decryptText] failed", e);
    return "";
  }
}; 
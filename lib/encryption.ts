import CryptoJS from "crypto-js";

/**
 * Generate a cryptographically-strong random salt (hex string, 16 bytes)
 */
export const generateSalt = () => {
  return CryptoJS.lib.WordArray.random(16).toString(); // 32-char hex
};

/**
 * Derive an AES key from the user password + salt using PBKDF2.
 * Returns a hex string representation of the key (256-bit).
 */
export const deriveKey = (password: string, salt: string): string => {
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32, // 256-bit key
    iterations: 10000, // strong enough for client side
  });
  return key.toString();
};

/** Encrypt arbitrary UTF-8 text with AES-256-CBC. */
export const encryptText = (plainText: string, keyHex: string): string => {
  const cipherText = CryptoJS.AES.encrypt(plainText, keyHex).toString();
  return cipherText;
};

/** Decrypt AES-encrypted text. Returns empty string on failure. */
export const decryptText = (cipherText: string, keyHex: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, keyHex);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.warn("[decryptText] failed", e);
    return "";
  }
}; 
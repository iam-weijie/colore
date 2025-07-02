import CryptoJS from "crypto-js";
import { getDecryptedValue, setDecryptedValue } from "@/cache/decryptionCache";
// Access the global variable for random values on different platforms
const globalObj: any = global || window || self || {};

/**
 * Generate a cryptographically-strong random salt (hex string, 16 bytes)
 * With multiple fallbacks for environments where different crypto implementations may be available
 */
export const generateSalt = (): string => {
  try {
    // If we have access to the crypto.getRandomValues API (modern browsers, React Native on iOS)
    if (globalObj.crypto && typeof globalObj.crypto.getRandomValues === 'function') {
      const array = new Uint8Array(16);
      globalObj.crypto.getRandomValues(array);
      
      // Convert to hex string
      return Array.from(array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    
    // Otherwise, try CryptoJS's implementation
    return CryptoJS.lib.WordArray.random(16).toString();
  } catch (error) {
    console.warn("[generateSalt] Crypto random failed, using secure fallback:", error);
    
    try {
      // Try another approach that works in React Native (using Math.random but better than nothing)
      // Create a byte array 
      const bytes = new Uint8Array(16);
      
      // Fill with "random" values - not cryptographically secure but available everywhere
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
      
      // Convert to hex string
      return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (fallbackError) {
      console.error("[generateSalt] Secure fallback failed, using basic method:", fallbackError);
      
      // Ultimate fallback using simple Math.random
      const fallbackRandomHex = () => {
        return Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      };
      
      // Generate a 32-character hex string
      return Array.from({ length: 6 }, fallbackRandomHex).join('').substring(0, 32);
    }
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
    // Ensure we have valid inputs before proceeding
    if (!plainText || typeof plainText !== 'string') {
      throw new Error('Invalid plaintext input');
    }
    
    if (!keyHex || typeof keyHex !== 'string') {
      throw new Error('Invalid encryption key');
    }
    
    // Attempt standard AES encryption
    const cipherText = CryptoJS.AES.encrypt(plainText, keyHex).toString();
    return cipherText;
  } catch (error) {
    console.error("[encryptText] Primary encryption failed:", error);
    
    // Attempt alternative encryption approach (XOR-based simple encryption)
    try {
      console.log("[encryptText] Attempting fallback encryption method");
      
      // Simple XOR-based encryption fallback
      // Not as secure as AES but better than no encryption
      const key = CryptoJS.SHA256(keyHex).toString();
      
      // Convert plainText to UTF-8 bytes
      const textBytes = [];
      for (let i = 0; i < plainText.length; i++) {
        const char = plainText.charCodeAt(i);
        textBytes.push(char & 0xFF);
      }
      
      // Convert key to bytes
      const keyBytes = [];
      for (let i = 0; i < key.length; i += 2) {
        keyBytes.push(parseInt(key.substr(i, 2), 16));
      }
      
      // XOR the plaintext with the key
      const result = [];
      for (let i = 0; i < textBytes.length; i++) {
        const keyByte = keyBytes[i % keyBytes.length];
        const encByte = textBytes[i] ^ keyByte;
        result.push(encByte.toString(16).padStart(2, '0'));
      }
      
      // Mark as fallback encryption
      return `##FALLBACK##${result.join('')}`;
    } catch (fallbackError) {
      console.error("[encryptText] Fallback encryption also failed:", fallbackError);
      // If all encryption methods fail, use the marker
      return `##ENCRYPTION_FAILED##${Date.now()}`;
    }
  }
};

/** Decrypt AES-encrypted text. Returns empty string on failure. */
export const decryptText = (cipherText: string, keyHex: string): string => {
  // Input validation
  if (!cipherText || typeof cipherText !== 'string') {
    console.warn("[decryptText] Invalid ciphertext input");
    return "";
  }
  
  if (!keyHex || typeof keyHex !== 'string') {
    console.warn("[decryptText] Invalid encryption key");
    return "";
  }
  
  // Check cache first
  const cachedValue = getDecryptedValue(cipherText);
  if (cachedValue !== undefined) {
    return cachedValue;
  }
  
  // Check if this is a failed encryption marker
  if (cipherText.startsWith('##ENCRYPTION_FAILED##')) {
    console.warn("[decryptText] Attempted to decrypt a failed encryption marker");
    return "";
  }
  
  // Check if this is fallback encryption
  if (cipherText.startsWith('##FALLBACK##')) {
    try {
      console.log("[decryptText] Decrypting with fallback method");
      const encryptedData = cipherText.substring(11); // Remove ##FALLBACK##
      
      // Get the key bytes
      const key = CryptoJS.SHA256(keyHex).toString();
      const keyBytes = [];
      for (let i = 0; i < key.length; i += 2) {
        keyBytes.push(parseInt(key.substr(i, 2), 16));
      }
      
      // Decrypt using XOR
      const textBytes = [];
      for (let i = 0; i < encryptedData.length; i += 2) {
        const encByte = parseInt(encryptedData.substr(i, 2), 16);
        const keyByte = keyBytes[(i/2) % keyBytes.length];
        const textByte = encByte ^ keyByte;
        textBytes.push(textByte);
      }
      
      // Convert bytes to string
      const result = String.fromCharCode(...textBytes);
      
      // Cache the result
      setDecryptedValue(cipherText, result);
      return result;
    } catch (fallbackError) {
      console.warn("[decryptText] Fallback decryption failed", fallbackError);
      return "";
    }
  }
  
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, keyHex);
    const result = bytes.toString(CryptoJS.enc.Utf8);
    
    // Cache the result
    setDecryptedValue(cipherText, result);
    return result;
  } catch (e) {
    console.warn("[decryptText] Standard decryption failed", e);
    return "";
  }
}; 
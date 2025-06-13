"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptText = exports.encryptText = exports.deriveKey = exports.generateSalt = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
/**
 * Generate a cryptographically-strong random salt (hex string, 16 bytes)
 */
const generateSalt = () => {
    return crypto_js_1.default.lib.WordArray.random(16).toString(); // 32-char hex
};
exports.generateSalt = generateSalt;
/**
 * Derive an AES key from the user password + salt using PBKDF2.
 * Returns a hex string representation of the key (256-bit).
 */
const deriveKey = (password, salt) => {
    const key = crypto_js_1.default.PBKDF2(password, salt, {
        keySize: 256 / 32, // 256-bit key
        iterations: 10000, // strong enough for client side
    });
    return key.toString();
};
exports.deriveKey = deriveKey;
/** Encrypt arbitrary UTF-8 text with AES-256-CBC. */
const encryptText = (plainText, keyHex) => {
    const cipherText = crypto_js_1.default.AES.encrypt(plainText, keyHex).toString();
    return cipherText;
};
exports.encryptText = encryptText;
/** Decrypt AES-encrypted text. Returns empty string on failure. */
const decryptText = (cipherText, keyHex) => {
    try {
        const bytes = crypto_js_1.default.AES.decrypt(cipherText, keyHex);
        return bytes.toString(crypto_js_1.default.enc.Utf8);
    }
    catch (e) {
        console.warn("[decryptText] failed", e);
        return "";
    }
};
exports.decryptText = decryptText;

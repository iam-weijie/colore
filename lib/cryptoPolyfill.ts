/**
 * Crypto polyfill for React Native
 * This file provides fallbacks for the crypto functionality missing in React Native
 */

// Get the global object (window, global, or self)
const g: any = typeof global !== 'undefined' ? global : 
              typeof window !== 'undefined' ? window :
              typeof self !== 'undefined' ? self : {};

// Create a mock crypto object if it doesn't exist
if (!g.crypto) {
  g.crypto = {};
}

// Implement getRandomValues if it doesn't exist
if (!g.crypto.getRandomValues) {
  g.crypto.getRandomValues = (array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
}

export default g.crypto; 
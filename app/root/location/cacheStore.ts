// Shared cache to store states data globally
// This allows access to states data across multiple components

interface State {
  name: string;
  cities: string[];
}

// Cache for country states
export const statesCache: Record<string, State[]> = {};

// Helper function to add states to cache
export const addStatesToCache = (countryCode: string, states: State[]): void => {
  statesCache[countryCode] = states;
};

// Helper function to get states from cache
export const getStatesFromCache = (countryCode: string): State[] => {
  return statesCache[countryCode] || [];
};

// Helper to check if cache contains states for a country
export const hasCountryStates = (countryCode: string): boolean => {
  return !!statesCache[countryCode] && statesCache[countryCode].length > 0;
};

// Generate an acronym from a location name
export const generateAcronym = (name: string): string => {
  if (!name) return '';
  
  // Remove any text in parentheses 
  const cleanedName = name.replace(/\s*\([^)]*\)\s*/g, '').trim();
  
  // Split by spaces or hyphens and get first letter of each word
  const words = cleanedName.split(/[\s-]+/);
  
  // For single word names, take first 3 letters
  if (words.length === 1 && words[0].length > 3) {
    return words[0].substring(0, 3).toUpperCase();
  }
  
  // For multi-word names, take first letter of each word
  return words.map(word => word.charAt(0).toUpperCase()).join('');
};

// Check if a name is too long for display
export const isNameTooLong = (name: string, maxLength: number = 12): boolean => {
  return name.length > maxLength;
};

// This is a placeholder component to satisfy the default export requirement
// The router system expects a React component to be the default export
import React from 'react';
const CacheStoreComponent = () => null;
export default CacheStoreComponent; 
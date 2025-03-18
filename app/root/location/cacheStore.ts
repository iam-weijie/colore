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
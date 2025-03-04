import axios from "axios";

// Define types for country data
interface Country {
  name: {
    common: string;
  };
  cca2: string; // Country code (ISO 3166-1 alpha-2)
  region: string;
  subregion: string;
  latlng: [number, number]; // Latitude and Longitude
  flags: {
    png: string;
  };
}

// Fetch all countries from the API
export const fetchCountries = async (): Promise<Country[]> => {
  try {
    const response = await axios.get("https://restcountries.com/v3.1/all");
    return response.data; // Returns an array of countries
  } catch (error) {
    console.error("Error fetching countries:", error);
    throw error;
  }
};

// Fetch a single country by its code (ISO alpha-2 code)
export const fetchCountryByCode = async (
  countryCode: string
): Promise<Country | undefined> => {
  try {
    const response = await axios.get(
      `https://restcountries.com/v3.1/alpha/${countryCode}`
    );
    return response.data[0]; // Returns a single country object
  } catch (error) {
    console.error(`Error fetching country with code ${countryCode}:`, error);
    throw error;
  }
};

// Fetch states (subdivisions) for a specific country
// Note: Not all countries have states or provinces listed in the API
export const fetchStatesForCountry = async (
  countryCode: string
): Promise<string[] | undefined> => {
  try {
    const country = await fetchCountryByCode(countryCode);
    if (country && country.provinces) {
      return country.provinces; // Return an array of states/provinces
    }
    return []; // Return an empty array if no states are found
  } catch (error) {
    console.error(`Error fetching states for country ${countryCode}:`, error);
    throw error;
  }
};

// Fetch cities for a country or state (if the data is available)
// Note: The REST API does not provide city data directly. You would need a separate service for that.
export const fetchCitiesForCountryOrState = async (
  countryCode: string
): Promise<string[] | undefined> => {
  try {
    // In this example, we're returning a placeholder array since cities aren't available in the API
    // For real-world use, you would need another API (like Geonames or OpenCage) to get city data
    console.log(
      "Cities are not available in the API directly. Consider using another API for city data."
    );
    return ["New York", "London", "Paris"]; // Placeholder
  } catch (error) {
    console.error(`Error fetching cities for country ${countryCode}:`, error);
    throw error;
  }
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCitiesForCountryOrState = exports.fetchStatesForCountry = exports.fetchCountryByName = exports.fetchCountryByCode = exports.fetchCountries = void 0;
const axios_1 = __importDefault(require("axios"));
// Fetch all countries from the API
const fetchCountries = async () => {
    try {
        const response = await axios_1.default.get("https://restcountries.com/v3.1/all");
        return response.data; // Returns an array of countries
    }
    catch (error) {
        console.error("Error fetching countries:", error);
        throw error;
    }
};
exports.fetchCountries = fetchCountries;
// Fetch a single country by its code (ISO alpha-2 code)
const fetchCountryByCode = async (countryCode) => {
    try {
        const response = await axios_1.default.get(`https://restcountries.com/v3.1/alpha/${countryCode}`);
        return response.data[0]; // Returns a single country object
    }
    catch (error) {
        console.error(`Error fetching country with code ${countryCode}:`, error);
        throw error;
    }
};
exports.fetchCountryByCode = fetchCountryByCode;
const fetchCountryByName = async (countryName) => {
    try {
        const response = await axios_1.default.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`);
        if (response.data.length === 0)
            return;
        return response.data[0].cca2.toLowerCase(); // Returns a single country object
    }
    catch (error) {
        console.error(`Error fetching country with name ${countryName}:`, error);
        throw error;
    }
};
exports.fetchCountryByName = fetchCountryByName;
// Fetch states (subdivisions) for a specific country
// Note: Not all countries have states or provinces listed in the API
const fetchStatesForCountry = async (countryCode) => {
    try {
        const country = await (0, exports.fetchCountryByCode)(countryCode);
        if (country && country.provinces) {
            return country.provinces; // Return an array of states/provinces
        }
        return []; // Return an empty array if no states are found
    }
    catch (error) {
        console.error(`Error fetching states for country ${countryCode}:`, error);
        throw error;
    }
};
exports.fetchStatesForCountry = fetchStatesForCountry;
// Fetch cities for a country or state (if the data is available)
// Note: The REST API does not provide city data directly. You would need a separate service for that.
const fetchCitiesForCountryOrState = async (countryCode) => {
    try {
        // In this example, we're returning a placeholder array since cities aren't available in the API
        // For real-world use, you would need another API (like Geonames or OpenCage) to get city data
        console.log("Cities are not available in the API directly. Consider using another API for city data.");
        return ["New York", "London", "Paris"]; // Placeholder
    }
    catch (error) {
        console.error(`Error fetching cities for country ${countryCode}:`, error);
        throw error;
    }
};
exports.fetchCitiesForCountryOrState = fetchCitiesForCountryOrState;

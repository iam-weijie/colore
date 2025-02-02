import axios from 'axios';

const AllCountries = async () => {
      try {
        // GitHub raw URL for the JSON file
        const response = await axios.get("https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries%2Bstates%2Bcities.json");
        
        // Assuming the JSON has a 'countries' array in the format:
        // [{ "name": { "common": "Country Name" }, "cca2": "US" }]
        const countryData = response.data.map((country: any) => ({
          cca2: country.cca2,
          name: country.name || "Unknown",  // Access the common name safely
        }));

        // Sort countries alphabetically by name
        const sortedCountries = countryData.sort((a, b) => a.name.localeCompare(b.name));
         return sortedCountries;
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };
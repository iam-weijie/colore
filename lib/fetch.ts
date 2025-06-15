import { useCallback, useEffect, useState } from "react";

export const fetchAPI = async (url: string, options?: RequestInit) => {
  try {
    // console.log(`[fetchAPI] Requesting: ${url}`, options);
    
    const response = await fetch(url, options);
    // console.log(`[fetchAPI] Response status: ${response.status}, statusText: ${response.statusText}`);
    // console.log(`[fetchAPI] Response headers:`, Object.fromEntries([...response.headers.entries()]));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Check if the content type is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const jsonData = await response.json();
      // console.log(`[fetchAPI] Parsed JSON data:`, jsonData);
      return jsonData;
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      // console.log(`[fetchAPI] Response text (not JSON):`, text.substring(0, 200));
      try {
        // Try to parse as JSON anyway
        const parsedData = JSON.parse(text);
        // console.log(`[fetchAPI] Successfully parsed text as JSON:`, parsedData);
        return parsedData;
      } catch (e) {
        // If parsing fails, return a structured error
        // console.error("[fetchAPI] Response is not valid JSON:", text);
        return {
          error: "Invalid JSON response",
          details: text.substring(0, 100) // Include the start of the response for debugging
        };
      }
    }
  } catch (error) {
    // console.error("[fetchAPI] Fetch error:", error);
    // Return a structured error instead of throwing
    return {
      error: "Request failed",
      details: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

export const useFetch = <T>(url: string, options?: RequestInit) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAPI(url, options);
      setData(result.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

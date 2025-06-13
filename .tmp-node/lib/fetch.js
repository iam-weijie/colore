"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFetch = exports.fetchAPI = void 0;
const react_1 = require("react");
const fetchAPI = async (url, options) => {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            //console.log("Response:", response)
            new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }
    catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
};
exports.fetchAPI = fetchAPI;
const useFetch = (url, options) => {
    const [data, setData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchData = (0, react_1.useCallback)(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await (0, exports.fetchAPI)(url, options);
            setData(result.data);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    }, [url, options]);
    (0, react_1.useEffect)(() => {
        fetchData();
    }, [fetchData]);
    return { data, loading, error, refetch: fetchData };
};
exports.useFetch = useFetch;

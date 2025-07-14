// src/services/hotelService.js

const API_BASE_URL = 'http://localhost:8060/api/hotels'; // Base URL for your hotel API

/**
 * Helper function to make authenticated API calls.
 * @param {string} url The API endpoint URL.
 * @param {string} method The HTTP method (e.g., 'GET', 'POST').
 * @param {string} token The JWT token for authorization.
 * @param {Object} [body=null] The request body for POST/PUT requests.
 * @returns {Promise<Object>} The data payload from the API response.
 * @throws {Error} If the API call fails or returns an error.
 */
const callApi = async (url, method, token, body = null) => {
  // *** ADDED CHECK HERE ***
  if (!token) {
    console.error("Authentication Error: No token provided for API call to", url);
    throw new Error("Authentication token not found. Please log in.");
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`, // Include the JWT token
  };

  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  try {
    const response = await fetch(url, options);

    // Read the response body as text ONCE
    const responseText = await response.text();

    let jsonResponse;
    try {
      // Attempt to parse the text as JSON
      jsonResponse = JSON.parse(responseText);
    } catch (jsonParseError) {
      // If JSON parsing fails, it means the response was not valid JSON.
      // This could be an HTML error page or malformed JSON.
      console.error("Failed to parse response as JSON. Raw response:", responseText);
      throw new Error(`Server responded with non-JSON content (Status: ${response.status}). Raw response: ${responseText.substring(0, 200)}...`);
    }

    if (!response.ok) {
      // If the response status is not OK, extract the error message from the parsed JSON.
      // Assuming error responses might still follow the RestResponse structure with 'data.error' or 'message'.
      const errorMessage = jsonResponse.data && jsonResponse.data.error
                               ? jsonResponse.data.error
                               : jsonResponse.message || 'An unknown error occurred.';
      throw new Error(errorMessage);
    }

    // If the response is OK, and it's a direct array (like your getAllHotels response),
    // return the jsonResponse directly.
    // If it's wrapped in a RestResponse (like your other endpoints usually are),
    // then return jsonResponse.data.
    if (Array.isArray(jsonResponse) || (jsonResponse && typeof jsonResponse === 'object' && jsonResponse.hotelId)) {
        // This likely means it's a direct array of hotels or a single hotel object
        return jsonResponse;
    } else if (jsonResponse && jsonResponse.data !== undefined) {
        // This means it's wrapped in your RestResponse structure
        return jsonResponse.data;
    } else {
        // Fallback for unexpected successful response structures
        console.warn("Unexpected successful API response structure:", jsonResponse);
        return jsonResponse;
    }

  } catch (error) {
    console.error(`API call failed for ${url}:`, error);
    throw error; // Re-throw the error for the component to handle
  }
};

/**
 * Fetches all hotels from the backend.
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Array<Object>>} A promise that resolves to a list of hotel objects.
 */
export const getAllHotels = async (token) => {
  return callApi(`${API_BASE_URL}`, 'GET', token);
};

/**
 * Fetches a single hotel by its ID from the backend.
 * @param {number} hotelId The ID of the hotel to fetch.
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Object>} A promise that resolves to a single hotel object.
 */
export const getHotelById = async (hotelId, token) => {
  return callApi(`${API_BASE_URL}/${hotelId}`, 'GET', token);
};

/**
 * Searches hotels by location from the backend.
 * @param {string} location The location to search for.
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Array<Object>>} A promise that resolves to a list of matching hotel objects.
 */
export const searchHotelsByLocation = async (location, token) => {
  return callApi(`${API_BASE_URL}/search?location=${encodeURIComponent(location)}`, 'GET', token);
};

// You can add more functions here for other hotel-related operations (register, update, delete)
// export const registerHotel = async (hotelData, role, token) => {
//   return callApi(`${API_BASE_URL}?role=${encodeURIComponent(role)}`, 'POST', token, hotelData);
// };

// export const updateHotel = async (hotelId, hotelData, role, token) => {
//   return callApi(`${API_BASE_URL}/${hotelId}?role=${encodeURIComponent(role)}`, 'PUT', token, hotelData);
// };

// export const deleteHotel = async (hotelId, role, token) => {
//   return callApi(`${API_BASE_URL}/${hotelId}?role=${encodeURIComponent(role)}`, 'DELETE', token);
// };

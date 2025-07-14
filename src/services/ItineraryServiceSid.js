// src/services/itineraryService.js

const API_BASE_URL = 'http://localhost:8060/api/v1/itineraries'; // Base URL for your itinerary API

const DEFAULT_ITINERARY_PAGE_NUMBER = 0;
const DEFAULT_ITINERARY_PAGE_SIZE = 10;
const DEFAULT_ITINERARY_SORT_BY = 'itineraryId'; // Or 'createdAt'
const DEFAULT_ITINERARY_SORT_DIR = 'asc';

/**
 * Helper function to make authenticated API calls for itineraries.
 * Assumes responses are either ItineraryDto, ItineraryResponse, or List<TopSellingPackageDto>.
 * @param {string} url The API endpoint URL.
 * @param {string} method The HTTP method (e.g., 'GET', 'POST', 'PUT').
 * @param {string} token The JWT token for authorization.
 * @param {Object} [body=null] The request body for POST/PUT requests.
 * @returns {Promise<Object|Array>} The data payload from the API response.
 * @throws {Error} If the API call fails or returns an error.
 */
const callItineraryApi = async (url, method, token, body = null) => {
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
    const responseText = await response.text(); // Read response body as text once

    // Log the raw response text if the response was not OK, for debugging purposes
    if (!response.ok) {
      console.error(`Itinerary API call to ${url} failed with status ${response.status}. Raw response:`, responseText);
    }

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch (jsonParseError) {
      console.error("Failed to parse itinerary API response as JSON. Raw response:", responseText);
      throw new Error(`Itinerary API responded with non-JSON content (Status: ${response.status}). Raw response: ${responseText.substring(0, 200)}...`);
    }

    if (!response.ok) {
      // Assuming error responses might have a 'message' field or 'data.error'
      const errorMessage = jsonResponse.message || (jsonResponse.data && jsonResponse.data.error) || 'An unknown error occurred during itinerary operation.';
      throw new Error(errorMessage);
    }

    // ItineraryController returns ItineraryDto, ItineraryResponse, or List<TopSellingPackageDto> directly
    return jsonResponse;

  } catch (error) {
    console.error(`Itinerary API call failed for ${url}:`, error);
    throw error;
  }
};

/**
 * Creates a new itinerary.
 * POST /api/v1/itineraries
 * @param {Object} itineraryDto The itinerary details.
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Object>} The created ItineraryDto.
 */
export const createItinerary = async (itineraryDto, token) => {
  return callItineraryApi(`${API_BASE_URL}`, 'POST', token, itineraryDto);
};

/**
 * Retrieves all itineraries with pagination and sorting.
 * GET /api/v1/itineraries
 * @param {string} token The JWT token for authorization.
 * @param {Object} params Pagination and sorting parameters.
 * @param {number} [params.pageNo=DEFAULT_ITINERARY_PAGE_NUMBER]
 * @param {number} [params.pageSize=DEFAULT_ITINERARY_PAGE_SIZE]
 * @param {string} [params.sortBy=DEFAULT_ITINERARY_SORT_BY]
 * @param {string} [params.sortDir=DEFAULT_ITINERARY_SORT_DIR]
 * @returns {Promise<Object>} An ItineraryResponse object.
 */
export const getAllItineraries = async (token, {
  pageNo = DEFAULT_ITINERARY_PAGE_NUMBER,
  pageSize = DEFAULT_ITINERARY_PAGE_SIZE,
  sortBy = DEFAULT_ITINERARY_SORT_BY,
  sortDir = DEFAULT_ITINERARY_SORT_DIR
} = {}) => {
  const query = new URLSearchParams({ pageNo, pageSize, sortBy, sortDir }).toString();
  return callItineraryApi(`${API_BASE_URL}?${query}`, 'GET', token);
};

/**
 * Updates an itinerary by ID.
 * PUT /api/v1/itineraries/{id}
 * @param {number} id The itinerary ID.
 * @param {Object} itineraryDto The updated itinerary details.
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Object>} The updated ItineraryDto.
 */
export const updateItineraryById = async (id, itineraryDto, token) => {
  return callItineraryApi(`${API_BASE_URL}/${id}`, 'PUT', token, itineraryDto);
};

/**
 * Retrieves an itinerary by ID.
 * GET /api/v1/itineraries/{id}
 * @param {number} id The itinerary ID.
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Object>} An ItineraryDto.
 */
export const getItineraryById = async (id, token) => {
  return callItineraryApi(`${API_BASE_URL}/${id}`, 'GET', token);
};

/**
 * Retrieves top-selling travel packages for dashboard display.
 * GET /api/v1/itineraries/dashboard/topsellingpackages
 * @param {string} token The JWT token for authorization.
 * @param {number} [limit=5] The number of top packages to retrieve.
 * @returns {Promise<Array<Object>>} A list of TopSellingPackageDto objects.
 */
export const getTopSellingPackages = async (token, limit = 5) => {
  const query = new URLSearchParams({ limit }).toString();
  return callItineraryApi(`${API_BASE_URL}/dashboard/topsellingpackages?${query}`, 'GET', token);
};

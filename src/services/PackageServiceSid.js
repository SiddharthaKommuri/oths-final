// src/services/travelPackageService.js

const API_BASE_URL = 'http://localhost:8060/api/v1/packages'; // Base URL for your travel package API

// Default pagination and sorting constants (match your Spring Boot AppConstants)
const DEFAULT_PACKAGE_PAGE_NUMBER = 0;
const DEFAULT_PACKAGE_PAGE_SIZE = 10;
const DEFAULT_PACKAGE_SORT_BY = 'packageId'; // Or 'packageName'
const DEFAULT_PACKAGE_SORT_DIR = 'asc';

/**
 * Helper function to make authenticated API calls for travel packages.
 * Assumes responses are either TravelPackageDto or TravelPackageResponse.
 * @param {string} url The API endpoint URL.
 * @param {string} method The HTTP method (e.g., 'GET', 'POST', 'PUT', 'DELETE').
 * @param {string} token The JWT token for authorization.
 * @param {Object} [body=null] The request body for POST/PUT requests.
 * @returns {Promise<Object>} The data payload from the API response.
 * @throws {Error} If the API call fails or returns an error.
 */
const callTravelPackageApi = async (url, method, token, body = null) => {
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

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch (jsonParseError) {
      console.error("Failed to parse travel package API response as JSON. Raw response:", responseText);
      throw new Error(`Travel Package API responded with non-JSON content (Status: ${response.status}). Raw response: ${responseText.substring(0, 200)}...`);
    }

    if (!response.ok) {
      // Assuming error responses might have a 'message' field or 'data.error'
      const errorMessage = jsonResponse.message || (jsonResponse.data && jsonResponse.data.error) || 'An unknown error occurred during package operation.';
      throw new Error(errorMessage);
    }

    // TravelPackageController returns TravelPackageDto or TravelPackageResponse directly
    return jsonResponse;

  } catch (error) {
    console.error(`Travel Package API call failed for ${url}:`, error);
    throw error;
  }
};

/**
 * Creates a new travel package.
 * POST /api/v1/packages
 * @param {Object} travelPackageDto The package details.
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Object>} The created TravelPackageDto.
 */
export const createPackage = async (travelPackageDto, token) => {
  return callTravelPackageApi(`${API_BASE_URL}`, 'POST', token, travelPackageDto);
};

/**
 * Retrieves all travel packages with pagination and sorting.
 * GET /api/v1/packages
 * @param {string} token The JWT token for authorization.
 * @param {Object} params Pagination and sorting parameters.
 * @param {number} [params.pageNo=DEFAULT_PACKAGE_PAGE_NUMBER]
 * @param {number} [params.pageSize=DEFAULT_PACKAGE_PAGE_SIZE]
 * @param {string} [params.sortBy=DEFAULT_PACKAGE_SORT_BY]
 * @param {string} [params.sortDir=DEFAULT_PACKAGE_SORT_DIR]
 * @returns {Promise<Object>} A TravelPackageResponse object.
 */
export const getAllPackages = async (token, {
  pageNo = DEFAULT_PACKAGE_PAGE_NUMBER,
  pageSize = DEFAULT_PACKAGE_PAGE_SIZE,
  sortBy = DEFAULT_PACKAGE_SORT_BY,
  sortDir = DEFAULT_PACKAGE_SORT_DIR
} = {}) => {
  const query = new URLSearchParams({ pageNo, pageSize, sortBy, sortDir }).toString();
  return callTravelPackageApi(`${API_BASE_URL}?${query}`, 'GET', token);
};

/**
 * Retrieves a travel package by its ID.
 * GET /api/v1/packages/{id}
 * @param {number} id The package ID.
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Object>} A TravelPackageDto.
 */
export const getPackageById = async (id, token) => {
  return callTravelPackageApi(`${API_BASE_URL}/${id}`, 'GET', token);
};

/**
 * Updates a travel package by its ID.
 * PUT /api/v1/packages/{id}
 * @param {number} id The package ID.
 * @param {Object} travelPackageDto The updated package details.
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Object>} The updated TravelPackageDto.
 */
export const updatePackageById = async (id, travelPackageDto, token) => {
  return callTravelPackageApi(`${API_BASE_URL}/${id}`, 'PUT', token, travelPackageDto);
};

/**
 * Retrieves the total count of travel packages.
 * GET /api/v1/packages/total
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<number>} The total count of packages.
 */
export const getTotalPackages = async (token) => {
  return callTravelPackageApi(`${API_BASE_URL}/total`, 'GET', token);
};

/**
 * Deletes a travel package by its ID.
 * DELETE /api/v1/packages/{id}
 * @param {number} id The package ID to delete.
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<string>} A success message.
 */
export const deletePackageById = async (id, token) => {
  return callTravelPackageApi(`${API_BASE_URL}/${id}`, 'DELETE', token);
};

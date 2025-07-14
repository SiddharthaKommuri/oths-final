// src/services/bookingService.js

const API_BASE_URL = 'http://localhost:8060/api/v1/bookings'; // Base URL for your booking API

/**
 * Helper function to make authenticated API calls for bookings.
 * This is specific to booking endpoints which might have different response structures
 * (e.g., BookingDto directly, or BookingResponseDto, not wrapped in RestResponse).
 * @param {string} url The API endpoint URL.
 * @param {string} method The HTTP method (e.g., 'GET', 'POST', 'PUT', 'DELETE').
 * @param {string} token The JWT token for authorization.
 * @param {Object} [body=null] The request body for POST/PUT requests.
 * @returns {Promise<Object>} The data payload from the API response.
 * @throws {Error} If the API call fails or returns an error.
 */
const callBookingApi = async (url, method, token, body = null) => {
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
      // If JSON parsing fails, it means the response was not valid JSON.
      console.error("Failed to parse booking API response as JSON. Raw response:", responseText);
      throw new Error(`Booking API responded with non-JSON content (Status: ${response.status}). Raw response: ${responseText.substring(0, 200)}...`);
    }

    if (!response.ok) {
      // Assuming error responses from booking service might also follow a consistent structure
      // Your BookingController returns ResponseEntity<BookingDto> or ResponseEntity<BookingResponseDto> directly
      // so 'message' might be directly in the JSON response, or you might need to adapt.
      const errorMessage = jsonResponse.message || (jsonResponse.data && jsonResponse.data.error) || 'An unknown error occurred during booking operation.';
      throw new Error(errorMessage);
    }

    // Booking service endpoints seem to return BookingDto or BookingResponseDto directly, not wrapped in RestResponse.
    return jsonResponse;

  } catch (error) {
    console.error(`Booking API call failed for ${url}:`, error);
    throw error;
  }
};

// Default pagination and sorting constants from your AppConstants (adjust if different in JS)
const DEFAULT_PAGE_NUMBER = 0;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT_BY = 'bookingId'; // Or 'createdAt' if you prefer
const DEFAULT_SORT_DIR = 'asc';

/**
 * Creates a new booking.
 * POST /api/v1/bookings
 * @param {Object} bookingDto The booking details (userId, type, hotelId/flightId/itineraryId, status, paymentId).
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Object>} The created BookingDto with generated ID.
 */
export const createBooking = async (bookingDto, token) => {
  return callBookingApi(`${API_BASE_URL}`, 'POST', token, bookingDto);
};

/**
 * Retrieves all bookings with pagination and sorting.
 * GET /api/v1/bookings
 * @param {string} token The JWT token for authorization.
 * @param {Object} params Pagination and sorting parameters.
 * @param {number} [params.pageNo=DEFAULT_PAGE_NUMBER] The page number to retrieve.
 * @param {number} [params.pageSize=DEFAULT_PAGE_SIZE] The number of records per page.
 * @param {string} [params.sortBy=DEFAULT_SORT_BY] The field to sort by.
 * @param {string} [params.sortDir=DEFAULT_SORT_DIR] The direction of sorting (asc/desc).
 * @returns {Promise<Object>} A BookingResponseDto object.
 */
export const getAllBookings = async (token, {
  pageNo = DEFAULT_PAGE_NUMBER,
  pageSize = DEFAULT_PAGE_SIZE,
  sortBy = DEFAULT_SORT_BY,
  sortDir = DEFAULT_SORT_DIR
} = {}) => {
  const query = new URLSearchParams({ pageNo, pageSize, sortBy, sortDir }).toString();
  return callBookingApi(`${API_BASE_URL}?${query}`, 'GET', token);
};

/**
 * Retrieves booking details by booking ID.
 * GET /api/v1/bookings/{id}
 * @param {number} id The ID of the booking.
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Object>} A BookingDto object.
 */
export const getBookingDetailsById = async (id, token) => {
  return callBookingApi(`${API_BASE_URL}/${id}`, 'GET', token);
};

/**
 * Updates a booking by its ID.
 * PUT /api/v1/bookings/{id}
 * @param {number} id The ID of the booking to update.
 * @param {Object} bookingDto The updated booking details.
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Object>} The updated BookingDto.
 */
export const updateBookingById = async (id, bookingDto, token) => {
  return callBookingApi(`${API_BASE_URL}/${id}`, 'PUT', token, bookingDto);
};

/**
 * Retrieves bookings made by a specific user.
 * GET /api/v1/bookings/user/{userId}
 * @param {number} userId The ID of the user.
 * @param {string} token The JWT token for authorization.
 * @param {Object} params Pagination and sorting parameters.
 * @param {number} [params.pageNo=DEFAULT_PAGE_NUMBER] The page number to retrieve.
 * @param {number} [params.pageSize=DEFAULT_PAGE_SIZE] The number of records per page.
 * @param {string} [params.sortBy=DEFAULT_SORT_BY] The field to sort by.
 * @param {string} [params.sortDir=DEFAULT_SORT_DIR] The direction of sorting (asc/desc).
 * @returns {Promise<Object>} A BookingResponseDto object.
 */
export const getBookingsByUserId = async (userId, token, {
  pageNo = DEFAULT_PAGE_NUMBER,
  pageSize = DEFAULT_PAGE_SIZE,
  sortBy = DEFAULT_SORT_BY,
  sortDir = DEFAULT_SORT_DIR
} = {}) => {
  const query = new URLSearchParams({ pageNo, pageSize, sortBy, sortDir }).toString();
  return callBookingApi(`${API_BASE_URL}/user/${userId}?${query}`, 'GET', token);
};

/**
 * Retrieves bookings filtered by booking type.
 * GET /api/v1/bookings/type/{type}
 * @param {string} type The type of booking (e.g., "flight", "hotel").
 * @param {string} token The JWT token for authorization.
 * @param {Object} params Pagination and sorting parameters.
 * @param {number} [params.pageNo=DEFAULT_PAGE_NUMBER] The page number to retrieve.
 * @param {number} [params.pageSize=DEFAULT_PAGE_SIZE] The number of records per page.
 * @param {string} [params.sortBy=DEFAULT_SORT_BY] The field to sort by.
 * @param {string} [params.sortDir=DEFAULT_SORT_DIR] The direction of sorting (asc/desc).
 * @returns {Promise<Object>} A BookingResponseDto object.
 */
export const getBookingsByType = async (type, token, {
  pageNo = DEFAULT_PAGE_NUMBER,
  pageSize = DEFAULT_PAGE_SIZE,
  sortBy = DEFAULT_SORT_BY,
  sortDir = DEFAULT_SORT_DIR
} = {}) => {
  const query = new URLSearchParams({ pageNo, pageSize, sortBy, sortDir }).toString();
  return callBookingApi(`${API_BASE_URL}/type/${type}?${query}`, 'GET', token);
};

/**
 * Retrieves bookings filtered by booking status.
 * GET /api/v1/bookings/status/{status}
 * @param {string} status The status of the booking (e.g., "confirmed", "cancelled").
 * @param {string} token The JWT token for authorization.
 * @param {Object} params Pagination and sorting parameters.
 * @param {number} [params.pageNo=DEFAULT_PAGE_NUMBER] The page number to retrieve.
 * @param {number} [params.pageSize=DEFAULT_PAGE_SIZE] The number of records per page.
 * @param {string} [params.sortBy=DEFAULT_SORT_BY] The field to sort by.
 * @param {string} [params.sortDir=DEFAULT_SORT_DIR] The direction of sorting (asc/desc).
 * @returns {Promise<Object>} A BookingResponseDto object.
 */
export const getBookingsByStatus = async (status, token, {
  pageNo = DEFAULT_PAGE_NUMBER,
  pageSize = DEFAULT_PAGE_SIZE,
  sortBy = DEFAULT_SORT_BY,
  sortDir = DEFAULT_SORT_DIR
} = {}) => {
  const query = new URLSearchParams({ pageNo, pageSize, sortBy, sortDir }).toString();
  return callBookingApi(`${API_BASE_URL}/status/${status}?${query}`, 'GET', token);
};

/**
 * Retrieves all active bookings.
 * GET /api/v1/bookings/active
 * @param {string} token The JWT token for authorization.
 * @param {Object} params Pagination and sorting parameters.
 * @param {number} [params.pageNo=DEFAULT_PAGE_NUMBER] The page number to retrieve.
 * @param {number} [params.pageSize=DEFAULT_PAGE_SIZE] The number of records per page.
 * @param {string} [params.sortBy=DEFAULT_SORT_BY] The field to sort by.
 * @param {string} [params.sortDir=DEFAULT_SORT_DIR] The direction of sorting (asc/desc).
 * @returns {Promise<Object>} A BookingResponseDto object.
 */
export const getActiveBookings = async (token, {
  pageNo = DEFAULT_PAGE_NUMBER,
  pageSize = DEFAULT_PAGE_SIZE,
  sortBy = DEFAULT_SORT_BY,
  sortDir = DEFAULT_SORT_DIR
} = {}) => {
  const query = new URLSearchParams({ pageNo, pageSize, sortBy, sortDir }).toString();
  return callBookingApi(`${API_BASE_URL}/active?${query}`, 'GET', token);
};

/**
 * Cancels a booking by its ID.
 * PUT /api/v1/bookings/{bookingId}/cancel
 * @param {number} bookingId The ID of the booking to cancel.
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Object>} The updated BookingDto.
 */
export const cancelBooking = async (bookingId, token) => {
  return callBookingApi(`${API_BASE_URL}/${bookingId}/cancel`, 'PUT', token);
};

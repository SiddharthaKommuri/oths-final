// src/services/reviewService.js

const API_BASE_URL = 'http://localhost:8060/api/reviews'; // Base URL for your review API

/**
 * Helper function to make authenticated API calls for reviews.
 * Assumes responses are either ReviewResponse or PostReviewResponse.
 * @param {string} url The API endpoint URL.
 * @param {string} method The HTTP method (e.g., 'GET', 'POST').
 * @param {string} token The JWT token for authorization.
 * @param {Object} [body=null] The request body for POST requests.
 * @returns {Promise<Object>} The data payload from the API response.
 * @throws {Error} If the API call fails or returns an error.
 */
const callReviewApi = async (url, method, token, body = null) => {
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
      console.error("Failed to parse review API response as JSON. Raw response:", responseText);
      throw new Error(`Review API responded with non-JSON content (Status: ${response.status}). Raw response: ${responseText.substring(0, 200)}...`);
    }

    if (!response.ok) {
      // Assuming error responses might have a 'message' field or 'data.error'
      const errorMessage = jsonResponse.message || (jsonResponse.data && jsonResponse.data.error) || 'An unknown error occurred during review operation.';
      throw new Error(errorMessage);
    }

    // ReviewController returns ReviewResponse or PostReviewResponse directly
    return jsonResponse;

  } catch (error) {
    console.error(`Review API call failed for ${url}:`, error);
    throw error;
  }
};

/**
 * Retrieves all reviews.
 * GET /api/reviews
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Object>} A ReviewResponse object containing a list of ReviewDTOs.
 */
export const getAllReviews = async (token) => {
  return callReviewApi(`${API_BASE_URL}`, 'GET', token);
};

/**
 * Retrieves reviews for a specific hotel.
 * GET /api/reviews/hotel/{hotelId}
 * @param {number} hotelId ID of the hotel.
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Object>} A ReviewResponse object containing a list of ReviewDTOs.
 */
export const getHotelReviews = async (hotelId, token) => {
  return callReviewApi(`${API_BASE_URL}/hotel/${hotelId}`, 'GET', token);
};

/**
 * Retrieves reviews for a specific flight.
 * GET /api/reviews/flight/{flightId}
 * @param {number} flightId ID of the flight.
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Object>} A ReviewResponse object containing a list of ReviewDTOs.
 */
export const getFlightReviews = async (flightId, token) => {
  return callReviewApi(`${API_BASE_URL}/flight/${flightId}`, 'GET', token);
};

/**
 * Posts a new review.
 * POST /api/reviews
 * @param {Object} reviewData The review details (userId, hotelId/flightId, rating, comment).
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Object>} A PostReviewResponse object containing the created ReviewDTO.
 */
export const postReview = async (reviewData, token) => {
  return callReviewApi(`${API_BASE_URL}`, 'POST', token, reviewData);
};

/**
 * Retrieves reviews for a specific user.
 * GET /api/reviews/user/{userId}
 * @param {number} userId ID of the user.
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Object>} A ReviewResponse object containing a list of ReviewDTOs.
 */
export const getReviewsByUserId = async (userId, token) => {
  return callReviewApi(`${API_BASE_URL}/user/${userId}`, 'GET', token);
};

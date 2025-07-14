import axios from "axios";

// Assuming your Spring Boot application runs on port 8080
// and the base path for bookings is /api/v1/bookings
const BOOKING_API_BASE_URL = "http://localhost:8060/api/v1/bookings";

class BookingService {
  /**
   * Generates authorization headers with a Bearer token.
   * @param {string} token The JWT token for authentication.
   * @returns {object} An object containing the headers for Axios requests.
   */
  getAuthHeaders(token) {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  /**
   * Creates a new booking.
   * @param {object} bookingDto The booking data transfer object.
   * @param {string} token The authentication token.
   * @returns {Promise} Axios promise for the POST request.
   */
  createBooking(bookingDto, token) {
    return axios.post(BOOKING_API_BASE_URL, bookingDto, this.getAuthHeaders(token));
  }

  /**
   * Retrieves all bookings with pagination and sorting.
   * @param {number} pageNo The page number (0-indexed).
   * @param {number} pageSize The number of items per page.
   * @param {string} sortBy The field to sort by.
   * @param {string} sortDir The sorting direction ('asc' or 'desc').
   * @param {string} token The authentication token.
   * @returns {Promise} Axios promise for the GET request.
   */
  getAllBookings(pageNo, pageSize, sortBy, sortDir, token) {
    return axios.get(
      `${BOOKING_API_BASE_URL}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}`,
      this.getAuthHeaders(token)
    );
  }

  /**
   * Retrieves booking details by booking ID.
   * @param {number} id The ID of the booking.
   * @param {string} token The authentication token.
   * @returns {Promise} Axios promise for the GET request.
   */
  getBookingDetailsById(id, token) {
    return axios.get(
      `${BOOKING_API_BASE_URL}/${id}`,
      this.getAuthHeaders(token)
    );
  }

  /**
   * Updates a booking by its ID.
   * @param {number} id The ID of the booking to update.
   * @param {object} bookingDto The updated booking data transfer object.
   * @param {string} token The authentication token.
   * @returns {Promise} Axios promise for the PUT request.
   */
  updateBookingById(id, bookingDto, token) {
    return axios.put(
      `${BOOKING_API_BASE_URL}/${id}`,
      bookingDto,
      this.getAuthHeaders(token)
    );
  }

  /**
   * Retrieves bookings made by a specific user with pagination and sorting.
   * @param {number} userId The ID of the user.
   * @param {number} pageNo The page number (0-indexed).
   * @param {number} pageSize The number of items per page.
   * @param {string} sortBy The field to sort by.
   * @param {string} sortDir The sorting direction ('asc' or 'desc').
   * @param {string} token The authentication token.
   * @returns {Promise} Axios promise for the GET request.
   */
  getBookingsByUserId(userId, pageNo, pageSize, sortBy, sortDir, token) {
    return axios.get(
      `${BOOKING_API_BASE_URL}/user/${userId}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}`,
      this.getAuthHeaders(token)
    );
  }

  /**
   * Retrieves bookings filtered by booking type with pagination and sorting.
   * @param {string} type The type of booking (e.g., "flight", "hotel").
   * @param {number} pageNo The page number (0-indexed).
   * @param {number} pageSize The number of items per page.
   * @param {string} sortBy The field to sort by.
   * @param {string} sortDir The sorting direction ('asc' or 'desc').
   * @param {string} token The authentication token.
   * @returns {Promise} Axios promise for the GET request.
   */
  getBookingsByType(type, pageNo, pageSize, sortBy, sortDir, token) {
    return axios.get(
      `${BOOKING_API_BASE_URL}/type/${type}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}`,
      this.getAuthHeaders(token)
    );
  }

  /**
   * Retrieves bookings filtered by booking status with pagination and sorting.
   * @param {string} status The status of the booking (e.g., "confirmed", "cancelled").
   * @param {number} pageNo The page number (0-indexed).
   * @param {number} pageSize The number of items per page.
   * @param {string} sortBy The field to sort by.
   * @param {string} sortDir The sorting direction ('asc' or 'desc').
   * @param {string} token The authentication token.
   * @returns {Promise} Axios promise for the GET request.
   */
  getBookingsByStatus(status, pageNo, pageSize, sortBy, sortDir, token) {
    return axios.get(
      `${BOOKING_API_BASE_URL}/status/${status}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}`,
      this.getAuthHeaders(token)
    );
  }

  /**
   * Retrieves all active bookings with pagination and sorting.
   * @param {number} pageNo The page number (0-indexed).
   * @param {number} pageSize The number of items per page.
   * @param {string} sortBy The field to sort by.
   * @param {string} sortDir The sorting direction ('asc' or 'desc').
   * @param {string} token The authentication token.
   * @returns {Promise} Axios promise for the GET request.
   */
  getActiveBookings(pageNo, pageSize, sortBy, sortDir, token) {
    return axios.get(
      `${BOOKING_API_BASE_URL}/active?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}`,
      this.getAuthHeaders(token)
    );
  }

  /**
   * Cancels a booking by its ID.
   * @param {number} bookingId The ID of the booking to cancel.
   * @param {string} token The authentication token.
   * @returns {Promise} Axios promise for the PUT request.
   */
  cancelBooking(bookingId, token) {
    return axios.put(
      `${BOOKING_API_BASE_URL}/${bookingId}/cancel`,
      {}, // Empty body for a simple PUT operation
      this.getAuthHeaders(token)
    );
  }
}

export default new BookingService();

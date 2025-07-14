// src/services/PaymentService.js
import axios from "axios";

const PAYMENT_API_BASE_URL = "http://localhost:8060/api/payments"; // Base URL for your payment API

class PaymentService {
  /**
   * Helper function to get authorization headers.
   * @param {string} token The JWT token for authentication.
   * @returns {object} An object containing the headers for Axios requests.
   * @throws {Error} If no token is provided.
   */
  getAuthHeaders(token) {
    if (!token) {
      throw new Error("Authentication token not found. Please log in.");
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  /**
   * Creates a new payment record in the backend.
   * POST /api/payments
   * @param {Object} paymentDto The payment details (userId, amount, paymentMethod, paymentStatus, paymentDate).
   * @param {string} token The JWT token for authorization.
   * @returns {Promise<AxiosResponse<object>>} A promise that resolves to the Axios response containing the created payment data.
   */
  createPayment(paymentDto, token) {
    return axios.post(PAYMENT_API_BASE_URL, paymentDto, this.getAuthHeaders(token));
  }

  /**
   * Fetches all payments from the backend.
   * @param {string} token The JWT token for authorization.
   * @returns {Promise<AxiosResponse<object>>} A promise that resolves to the Axios response containing payment data.
   * Expected response.data structure: { payments: [...] }
   */
  getAllPayments(token) {
    return axios.get(PAYMENT_API_BASE_URL, this.getAuthHeaders(token));
  }

  /**
   * Fetches payments for a specific user from the backend.
   * @param {number} userId The ID of the user.
   * @param {string} token The JWT token for authorization.
   * @returns {Promise<AxiosResponse<object>>} A promise that resolves to the Axios response containing payment data.
   * Expected response.data structure: { payments: [...] }
   */
  getPaymentsByUserId(userId, token) {
    return axios.get(`${PAYMENT_API_BASE_URL}/user/${userId}`, this.getAuthHeaders(token));
  }

  /**
   * Cancels a payment by its ID.
   * @param {number} paymentId The ID of the payment to cancel.
   * @param {string} token The JWT token for authorization.
   * @returns {Promise<AxiosResponse<object>>} A promise that resolves to the Axios response containing the updated payment.
   */
  cancelPayment(paymentId, token) {
    return axios.put(`${PAYMENT_API_BASE_URL}/${paymentId}/cancel`, {}, this.getAuthHeaders(token));
  }
}

export default new PaymentService();

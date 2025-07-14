// src/services/userService.js

// Base URL for your authentication API
const API_BASE_URL = 'http://localhost:8060/api/auth'; // Adjust this if your backend is on a different origin/port

/**
 * Fetches all users from the backend.
 * Includes JWT for authentication.
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Array<Object>>} A promise that resolves to a list of user DTOs.
 * @throws {Error} If the API call fails (e.g., network error, unauthorized, server error).
 */
export const getAllUsers = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Include the JWT token here
      },
    });
    const jsonResponse = await response.json();

    if (!response.ok) {
      // If the response status is not OK (e.g., 401 Unauthorized, 404, 500), throw an error
      const errorMessage = jsonResponse.data && jsonResponse.data.error
                           ? jsonResponse.data.error
                           : jsonResponse.message || 'Failed to fetch users.'; // Use 'message' field from RestResponse
      throw new Error(errorMessage);
    }

    // Assuming successful response structure is { status: 200, data: [...users], timestamp: "..." }
    return jsonResponse.data;
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error; // Re-throw to be handled by the component
  }
};

/**
 * Fetches a single user by their ID from the backend.
 * Includes JWT for authentication.
 * @param {string} userId The ID of the user to fetch.
 * @param {string} token The JWT token for authorization.
 * @returns {Promise<Object>} A promise that resolves to a single user DTO.
 * @throws {Error} If the API call fails or user is not found.
 */
export const getUserById = async (userId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Include the JWT token here
      },
    });
    const jsonResponse = await response.json();

    if (!response.ok) {
      const errorMessage = jsonResponse.data && jsonResponse.data.error
                           ? jsonResponse.data.error
                           : jsonResponse.message || `Failed to fetch user with ID ${userId}.`; // Use 'message' field from RestResponse
      throw new Error(errorMessage);
    }

    // Assuming successful response structure is { status: 200, data: {user}, timestamp: "..." }
    return jsonResponse.data;
  } catch (error) {
    console.error(`Error fetching user with ID ${userId}:`, error);
    throw error; // Re-throw to be handled by the component
  }
};

// You can add more functions here for other user-related operations (e.g., addUser, updateUser, deleteUser)
// export const addUser = async (userData) => { /* ... */ };
// export const updateUser = async (userId, userData) => { /* ... */ };
// export const deleteUser = async (userId) => { /* ... */ };

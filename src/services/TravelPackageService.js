import axios from "axios";
 
// Define the base URL for your travel package API
const TRAVEL_PACKAGE_API_BASE_URL = "http://localhost:8060/api/v1/packages"; // Assuming your Spring Boot app runs on 8080
 
class TravelPackageService {
  // This method will be useful if you implement authentication/authorization later
  // For now, it's included for consistency with your sample
  getAuthHeaders(token) {
    if (token) {
      return {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }
    return {}; // Return empty object if no token is provided
  }
 
  /**
   * Creates a new travel package.
   * @param {Object} travelPackageDto - The travel package details (packageName, location, price)
   * @param {string} [token] - Optional JWT token for authorization
   * @returns {Promise} Axios promise
   */
  createPackage(travelPackageDto, token) {
    return axios.post(
      TRAVEL_PACKAGE_API_BASE_URL,
      travelPackageDto,
      this.getAuthHeaders(token)
    );
  }
 
  /**
   * Retrieves all travel packages with pagination and sorting.
   * @param {number} [pageNo=0] - The page number (default 0)
   * @param {number} [pageSize=10] - The page size (default 10)
   * @param {string} [sortBy='id'] - The field to sort by (default 'id')
   * @param {string} [sortDir='asc'] - The sort direction (default 'asc')
   * @param {string} [token] - Optional JWT token for authorization
   * @returns {Promise} Axios promise
   */
  getAllPackages(pageNo = 0, pageSize = 10, sortBy = "packageId", sortDir = "asc", token) {
    return axios.get(
      TRAVEL_PACKAGE_API_BASE_URL,
      {
        params: {
          pageNo,
          pageSize,
          sortBy,
          sortDir,
        },
        ...this.getAuthHeaders(token), // Merge headers for authorization
      }
    );
  }
 
  /**
   * Retrieves a travel package by its ID.
   * @param {number} id - The package ID
   * @param {string} [token] - Optional JWT token for authorization
   * @returns {Promise} Axios promise
   */
  getPackageById(id, token) {
    return axios.get(
      `${TRAVEL_PACKAGE_API_BASE_URL}/${id}`,
      this.getAuthHeaders(token)
    );
  }
 
  /**
   * Updates a travel package by its ID.
   * @param {number} id - The package ID
   * @param {Object} travelPackageDto - The updated package details
   * @param {string} [token] - Optional JWT token for authorization
   * @returns {Promise} Axios promise
   */
  updatePackageById(id, travelPackageDto, token) {
    return axios.put(
      `${TRAVEL_PACKAGE_API_BASE_URL}/${id}`,
      travelPackageDto,
      this.getAuthHeaders(token)
    );
  }
 
  /**
   * Retrieves the total count of travel packages.
   * @param {string} [token] - Optional JWT token for authorization
   * @returns {Promise} Axios promise
   */
  getTotalPackageCount(token) {
    return axios.get(
      `${TRAVEL_PACKAGE_API_BASE_URL}/total`,
      this.getAuthHeaders(token)
    );
  }
 
 
  /**
   * Deletes a travel package by its ID.
   * @param {number} id - The package ID to delete
   * @param {string} [token] - Optional JWT token for authorization
   * @returns {Promise} Axios promise
   */
  deletePackageById(id, token) {
    return axios.delete(
        `${TRAVEL_PACKAGE_API_BASE_URL}/${id}`,
        this.getAuthHeaders(token)
    );
}
}
 
export default new TravelPackageService();
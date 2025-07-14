import axios from "axios";

const HOTEL_API_BASE_URL = "http://localhost:8060/api/hotels"; // via API Gateway

class HotelService {
  getAuthHeaders(token) {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  registerHotel(hotel, token, role) {
    return axios.post(
      `${HOTEL_API_BASE_URL}?role=${role}`,
      hotel,
      this.getAuthHeaders(token)
    );
  }

  updateHotel(hotelId, updatedHotel, token, role) {
    return axios.put(
      `${HOTEL_API_BASE_URL}/${hotelId}?role=${role}`,
      updatedHotel,
      this.getAuthHeaders(token)
    );
  }

  deleteHotel(hotelId, token, role) {
    return axios.delete(
      `${HOTEL_API_BASE_URL}/${hotelId}?role=${role}`,
      this.getAuthHeaders(token)
    );
  }

  getHotelById(hotelId, token) {
    return axios.get(
      `${HOTEL_API_BASE_URL}/${hotelId}`,
      this.getAuthHeaders(token)
    );
  }

  getAllHotels(token) {
    return axios
      .get(HOTEL_API_BASE_URL, this.getAuthHeaders(token))
      .then((res) => res.data); // ✅ return only the array, not Axios response object
  }

  searchHotels(location, token) {
    return axios.get(
      `${HOTEL_API_BASE_URL}/search?location=${encodeURIComponent(location)}`,
      this.getAuthHeaders(token)
    );
  }
}

export const hotelService = new HotelService();
export default hotelService;

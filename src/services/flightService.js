import axios from "axios";

const FLIGHT_API_BASE_URL = "http://localhost:8060/api/flights"; 


class FlightService {

  getAuthHeaders(token) {
    if (token) {
      return {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }
    return {}; 
  }


  addFlight(flightData, role, token) {
    return axios.post(
      `${FLIGHT_API_BASE_URL}?role=${role}`,
      flightData,
      this.getAuthHeaders(token)
    );
  }

 
  updateFlight(id, updatedFlightData, role, token) {
    return axios.put(
      `${FLIGHT_API_BASE_URL}/${id}?role=${role}`,
      updatedFlightData,
      this.getAuthHeaders(token)
    );
  }


  deleteFlight(id, role, token) {
    return axios.delete(
      `${FLIGHT_API_BASE_URL}/${id}?role=${role}`,
      this.getAuthHeaders(token)
    );
  }


  getFlightById(id, token) {
    return axios.get(
      `${FLIGHT_API_BASE_URL}/${id}`,
      this.getAuthHeaders(token)
    );
  }


  getAllFlights(token) {
    return axios.get(FLIGHT_API_BASE_URL, this.getAuthHeaders(token));
  }


  searchFlights(departure, arrival, token) {
    return axios.get(
      `${FLIGHT_API_BASE_URL}/search`,
      {
        params: { departure, arrival },
        ...this.getAuthHeaders(token), 
      }
    );
  }


  searchByAirline(airline, token) {
    return axios.get(
      `${FLIGHT_API_BASE_URL}/airline`,
      {
        params: { airline },
        ...this.getAuthHeaders(token),
      }
    );
  }


  searchByDepartureTime(departureTime, token) {
    return axios.get(
      `${FLIGHT_API_BASE_URL}/departure-time`,
      {
        params: { departureTime },
        ...this.getAuthHeaders(token),
      }
    );
  }


  searchByDuration(minMinutes, maxMinutes, token) {
    return axios.get(
      `${FLIGHT_API_BASE_URL}/duration`,
      {
        params: { minMinutes, maxMinutes },
        ...this.getAuthHeaders(token),
      }
    );
  }
}

export default new FlightService();

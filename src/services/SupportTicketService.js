import axios from "axios";

const TICKET_API_BASE_URL = "http://localhost:8060/api/support-tickets"; //8060

class SupportTicketService {
  getAuthHeaders(token) {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  // ADMIN
  getAllTickets(token) {
    return axios.get(TICKET_API_BASE_URL, this.getAuthHeaders(token));
  }

  getTicketById(ticketId, token) {
    return axios.get(
      `${TICKET_API_BASE_URL}/ticket/${ticketId}`,
      this.getAuthHeaders(token)
    );
  }

  getTicketsByStatus(status, token) {
    return axios.get(
      `${TICKET_API_BASE_URL}/status/${status}`,
      this.getAuthHeaders(token)
    );
  }

  getTotalTicketCount(token) {
    return axios.get(
      `${TICKET_API_BASE_URL}/count`,
      this.getAuthHeaders(token)
    );
  }

  assignAgentAndStatus(ticketId, data, token) {
    return axios.put(
      `${TICKET_API_BASE_URL}/${ticketId}/update`,
      data,
      this.getAuthHeaders(token)
    );
  }

  // USER
  getUserTickets(userId, token) {
    return axios.get(
      `${TICKET_API_BASE_URL}/user/${userId}`,
      this.getAuthHeaders(token)
    );
  }

  getUserTicketsByStatus(userId, status, token) {
    return axios.get(
      `${TICKET_API_BASE_URL}/user/${userId}/status/${status}`,
      this.getAuthHeaders(token)
    );
  }

  createTicket(ticket, token) {
    return axios.post(TICKET_API_BASE_URL, ticket, this.getAuthHeaders(token));
  }

  getUserTicketCount(userId, token) {
    return axios.get(
      `${TICKET_API_BASE_URL}/user/${userId}/count`,
      this.getAuthHeaders(token)
    );
  }

  // AGENT
  getAgentTickets(agentId) {
    return axios.get(`${TICKET_API_BASE_URL}/agent/${agentId}`);
  }

  getAgentTicketsByStatus(agentId, status) {
    return axios.get(
      `${TICKET_API_BASE_URL}/agent/${agentId}/status/${status}`
    );
  }

  getAgentTicketCount(agentId) {
    return axios.get(`${TICKET_API_BASE_URL}/agent/${agentId}/count`);
  }

  updateStatus(ticketId, data) {
    return axios.put(`${TICKET_API_BASE_URL}/${ticketId}/status`, data);
  }
}

export default new SupportTicketService();

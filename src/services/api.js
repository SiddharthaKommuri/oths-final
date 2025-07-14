import axios from 'axios';
import { getAuthToken } from '../utils/auth';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Mock backend URL
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('travora_auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
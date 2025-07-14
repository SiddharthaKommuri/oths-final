// Utility functions for authentication
export const getAuthToken = () => {
  return localStorage.getItem('travora_auth_token') || sessionStorage.getItem('travora_auth_token');
};

export const setAuthToken = (token, remember = false) => {
  if (remember) {
    localStorage.setItem('travora_auth_token', token);
  } else {
    sessionStorage.setItem('travora_auth_token', token);
  }
};

export const removeAuthToken = () => {
  localStorage.removeItem('travora_auth_token');
  sessionStorage.removeItem('travora_auth_token');
};
// API client utility for making authenticated requests

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.baseURL = API_URL;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  setToken(token) {
    localStorage.setItem('token', token);
  }

  removeToken() {
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    // Debug: Log token status
    if (!token && endpoint !== '/auth/login' && endpoint !== '/auth/signup' && endpoint !== '/auth/login/admin') {
      console.warn('⚠️ No token found for authenticated request to:', endpoint);
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle 401 specifically - token issues
        if (response.status === 401) {
          console.error('🔒 Authentication failed:', data.error);
          // If token is invalid, clear it
          if (data.error === 'Invalid token' || data.error === 'No token provided') {
            this.removeToken();
            localStorage.removeItem('user');
            // Optionally redirect to login
            if (window.location.pathname !== '/login' && window.location.pathname !== '/admin/login') {
              console.log('🔄 Redirecting to login due to invalid token...');
              // You could trigger a redirect here or dispatch an event
            }
          }
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;

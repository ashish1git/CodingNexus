// API client utility for making authenticated requests

// Get API URL from multiple sources (in order of priority):
// 1. Window config (set by server via index.html script)
// 2. Environment variable (build time)
// 3. Default fallback
function getApiUrl() {
  // Try window config first (runtime - preferred for deployment)
  if (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.API_URL) {
    console.log('🔌 Using API URL from window.CONFIG:', window.CONFIG.API_URL);
    return window.CONFIG.API_URL;
  }
  
  // Fall back to environment variable (build time)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    console.log('🔌 Using API URL from environment:', envUrl);
    return envUrl;
  }
  
  // Final fallback
  const defaultUrl = 'http://localhost:21000/api';
  console.log('🔌 Using default API URL:', defaultUrl);
  return defaultUrl;
}

const API_URL = getApiUrl();

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

    console.log(`📡 Calling: ${config.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, config);
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Server returned HTML (error page), not JSON
        const text = await response.text();
        console.error('❌ Server returned non-JSON response');
        console.error('   Status:', response.status);
        console.error('   Content-Type:', contentType);
        console.error('   Response:', text.substring(0, 200));
        throw new Error(`API server error - got ${contentType || 'HTML'} instead of JSON. Check if backend is running at: ${url}`);
      }

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
      console.error('API request failed:', error.message);
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

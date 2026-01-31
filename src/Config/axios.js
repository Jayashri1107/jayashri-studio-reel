import axios from 'axios';
import { BASE_URL } from './constants';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('studioToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - browser will set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const msg = error.response?.data?.message || '';
      const isExpired = /Token expired/i.test(msg);
      const isInvalid = /Invalid token|Unauthorized|token/i.test(msg);
      
      // Handle token expiration or invalid token
      if (isExpired || isInvalid) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('studioToken');
        // Only redirect if not already on login page
        if (window.location.pathname !== '/Login' && window.location.pathname !== '/Signup') {
          window.location.href = '/Login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
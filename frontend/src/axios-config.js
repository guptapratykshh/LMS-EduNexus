// Axios configuration for production
import axios from 'axios';

// Get backend URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://edunexus-backend-fvyc.onrender.com';

// Set default base URL for all axios requests
if (import.meta.env.PROD) {
  // In production, use full URL
  axios.defaults.baseURL = API_BASE_URL;
} else {
  // In development, keep relative URLs (vite proxy will handle it)
  axios.defaults.baseURL = '';
}

// Add auth token interceptor
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axios;


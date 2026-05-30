import axios from 'axios';

// In production (Vercel), point directly to the Render backend.
// In development, use '/api' which Vite proxies to localhost:5000.
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

// Media URL resolver — handles both old /uploads/ paths and new Cloudinary https:// URLs
export const resolveMediaUrl = (url) => {
  if (!url) return '';
  // Already a full URL (Cloudinary, etc.) — use as-is
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Relative /uploads/ path — prepend the Render backend URL
  const backendBase = import.meta.env.VITE_API_URL || '';
  return `${backendBase}${url}`;
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lovedale_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear stored data
      localStorage.removeItem('lovedale_token');
      // Only redirect if not already on auth page
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

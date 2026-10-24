// Centralized API Configuration

export const CLOUD_API_URL = 'https://pharmacy-backend-e210.onrender.com/api';
export const API_BASE_URL = import.meta.env.VITE_API_URL || CLOUD_API_URL;

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Ensure requests always hit the live online cloud server
  let targetUrl = url;
  if (targetUrl.includes('localhost:3000/api') || targetUrl.includes('api.davasetu.com/api')) {
    targetUrl = targetUrl
      .replace('http://localhost:3000/api', CLOUD_API_URL)
      .replace('https://api.davasetu.com/api', CLOUD_API_URL);
  }
  // Sanitize any accidental double /api/api
  if (targetUrl.includes('/api/api/')) {
    targetUrl = targetUrl.replace('/api/api/', '/api/');
  }

  const response = await fetch(targetUrl, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Clear invalid auth state and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pharmacy_profile_data');
    if (window.location.pathname !== '/login') {
      window.location.hash = '/login'; // Changed from .href to .hash since it's HashRouter
    }
  }

  if (response.status === 502 || response.status === 504) {
    throw new Error('Cannot connect to the backend server. Please make sure the backend is running.');
  }

  return response;
};

const api = {
  get: async (endpoint: string) => {
    const res = await apiFetch(`${API_BASE_URL}${endpoint}`);
    const data = await res.json();
    return { data, status: res.status };
  },
  post: async (endpoint: string, body: any) => {
    const res = await apiFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { data, status: res.status };
  },
  put: async (endpoint: string, body: any) => {
    const res = await apiFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { data, status: res.status };
  },
  delete: async (endpoint: string) => {
    const res = await apiFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    return { data, status: res.status };
  }
};

export default api;

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

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (primaryErr: any) {
    // If local dev server (localhost:3000) or placeholder URL is unreachable, fallback to production cloud backend
    if (url.includes('localhost:3000') || url.includes('api.davasetu.com')) {
      const fallbackUrl = url
        .replace('http://localhost:3000/api', CLOUD_API_URL)
        .replace('https://api.davasetu.com/api', CLOUD_API_URL);
      try {
        response = await fetch(fallbackUrl, {
          ...options,
          headers,
        });
      } catch (fallbackErr) {
        throw primaryErr;
      }
    } else {
      throw primaryErr;
    }
  }

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

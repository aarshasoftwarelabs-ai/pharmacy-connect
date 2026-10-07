// Centralized API Configuration

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.davasetu.com/api';

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Clear invalid auth state and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pharmacy_profile_data');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
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

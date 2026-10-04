// Centralized API Configuration

const hostname = window.location.hostname || '127.0.0.1';
export const API_BASE_URL = `http://${hostname}:3000/api`;

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

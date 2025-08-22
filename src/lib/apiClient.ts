import { API_URL } from "./api";

export function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  } as Record<string, string>;
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

// Backwards compatibility
export const apiClient = api;

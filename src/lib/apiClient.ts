import { API_URL } from "./api";

export function api(path: string, options: RequestInit = {}) {
  const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const headers = {
    ...(options.headers || {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
  } as Record<string, string>;
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

// Backwards compatibility
export const apiClient = api;

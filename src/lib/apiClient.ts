import { env } from "../config/env";
import { enhancedToast } from "@/components/ui/enhanced-toast";
const API_URL = env.API_URL;

let lastServerErrorAt = 0;
let lastNetworkErrorAt = 0;
const NOTIFY_COOLDOWN_MS = 5000;
let refreshInFlight: Promise<Response | null> | null = null;

export async function api(path: string, options: RequestInit = {}, _retry = true): Promise<Response> {
  const makeHeaders = () => {
    const accessToken = localStorage.getItem('accessToken');
    return {
      ...(options.headers || {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    } as Record<string, string>;
  };

  const doFetch = () => fetchWithTimeout(`${API_URL}${path}`, { ...options, headers: makeHeaders() }, 20000);

  let res: Response;
  try {
    res = await doFetch();
  } catch (e) {
    const now = Date.now();
    if (now - lastNetworkErrorAt > NOTIFY_COOLDOWN_MS) {
      lastNetworkErrorAt = now;
      enhancedToast.error('Nätverksfel: Kunde inte nå servern');
    }
    throw e;
  }
  if (res.status !== 401 || _retry === false) {
    noteServerError(res);
    if (res.status === 403) {
      enhancedToast.warning('Åtkomst nekad');
    }
    if (res.status === 429) {
      enhancedToast.warning('För många försök. Försök igen senare.');
    }
    return res;
  }

  // Undvik loop på login/refresh endpoints
  if (path.startsWith('/users/login') || path.startsWith('/users/refresh')) {
    return res;
  }

  // Försök att uppdatera access token
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return res;

  try {
    if (!refreshInFlight) {
      refreshInFlight = fetch(`${API_URL}/users/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      }).finally(() => { refreshInFlight = null; });
    }
    const refreshRes = await refreshInFlight;
    if (!refreshRes.ok) {
      // Misslyckades – rensa token lokalt
      localStorage.removeItem('accessToken');
      enhancedToast.warning('Sessionen har gått ut. Logga in igen.');
      noteServerError(res);
      if (res.status === 403) {
        enhancedToast.warning('Åtkomst nekad');
      }
      if (res.status === 429) {
        enhancedToast.warning('För många försök. Försök igen senare.');
      }
      return res;
    }
    const data = await refreshRes.json();
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    // Försök om request en gång till med nya tokens
    try {
      res = await fetch(`${API_URL}${path}`, { ...options, headers: makeHeaders() });
    } catch (e) {
      const now = Date.now();
      if (now - lastNetworkErrorAt > NOTIFY_COOLDOWN_MS) {
        lastNetworkErrorAt = now;
        enhancedToast.error('Nätverksfel: Kunde inte nå servern');
      }
      throw e;
    }
    noteServerError(res);
    if (res.status === 403) {
      enhancedToast.warning('Åtkomst nekad');
    }
    if (res.status === 429) {
      enhancedToast.warning('För många försök. Försök igen senare.');
    }
    return res;
  } catch {
    localStorage.removeItem('accessToken');
    noteServerError(res);
    if (res.status === 403) {
      enhancedToast.warning('Åtkomst nekad');
    }
    if (res.status === 429) {
      enhancedToast.warning('För många försök. Försök igen senare.');
    }
    return res;
  }
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

// Global response note: surface 5xx som standardiserad toast
// Konsumenter hanterar fortfarande res.ok själva.
(async () => {
  // no-op IIFE to make file a module while keeping helper below typed
})();

function noteServerError(res: Response) {
  if (res.status >= 500) {
    const now = Date.now();
    if (now - lastServerErrorAt > NOTIFY_COOLDOWN_MS) {
      lastServerErrorAt = now;
      enhancedToast.error('Serverfel: Något gick fel. Försök igen.');
    }
  }
}

function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal })
    .finally(() => clearTimeout(id));
}

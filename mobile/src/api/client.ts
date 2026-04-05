import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// In development, derive the backend host from Expo's dev server URL so the
// app reaches the correct machine whether running on simulator, emulator, or
// a physical device on the same network.
// In production, replace this with your deployed API URL.
function getBaseUrl(): string {
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0]; // strip the Metro port, keep only the IP
      console.log('[API] resolved backend host:', host);
      return `http://${host}:3000`;
    }
  }
  return 'http://localhost:3000';
}

export const BASE_URL = getBaseUrl();

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

/** Simulates network latency in mock calls */
export function mockDelay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}



// ─── Token store ─────────────────────────────────────────────────────────────
// In-memory cache for sync access by fetchApi. AuthContext handles the async
// SecureStore read on startup and calls setToken() to populate the cache.

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

let _token: string | null = null;
let _refreshToken: string | null = null;

// Deduplicates concurrent refresh attempts — only one refresh runs at a time.
let _refreshPromise: Promise<void> | null = null;

export async function persistToken(token: string | null): Promise<void> {
  _token = token;
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

export async function loadPersistedToken(): Promise<string | null> {
  const stored = await SecureStore.getItemAsync(TOKEN_KEY);
  _token = stored;
  return stored;
}

export function setToken(token: string | null): void {
  _token = token;
}

export function getToken(): string | null {
  return _token;
}

export async function persistRefreshToken(token: string | null): Promise<void> {
  _refreshToken = token;
  if (token) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
}

export async function loadPersistedRefreshToken(): Promise<string | null> {
  const stored = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  _refreshToken = stored;
  return stored;
}

export function setRefreshToken(token: string | null): void {
  _refreshToken = token;
}

export function getRefreshToken(): string | null {
  return _refreshToken;
}

// ─── Authenticated fetch helper ───────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Fetch a backend endpoint, inject the Bearer token, and unwrap the response envelope.
 * On a 401 response, attempts a token refresh once and retries the original request.
 * Throws ApiError on success:false responses or network failures.
 */
export async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
  _isRetry = false
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't override Content-Type for multipart (let fetch set it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const method = options.method ?? 'GET';
  const url = `${BASE_URL}${path}`;
  console.log(`[API] → ${method} ${url}`);

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (networkErr) {
    console.error(`[API] ✗ NETWORK ERROR ${method} ${url}`, networkErr);
    throw networkErr;
  }

  // ── Auto-refresh on 401 ──────────────────────────────────────────────────
  // Don't attempt refresh if this is already a retry or the refresh endpoint itself.
  if (response.status === 401 && !_isRetry && path !== '/auth/refresh') {
    const rt = getRefreshToken();
    if (rt) {
      if (!_refreshPromise) {
        _refreshPromise = (async () => {
          try {
            console.log('[API] access token expired, attempting refresh...');
            const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: rt }),
            });
            const refreshJson: ApiResponse<{ accessToken: string; refreshToken: string }> =
              await refreshResponse.json();

            if (!refreshJson.success || !refreshJson.data) {
              throw new Error('Refresh failed');
            }

            const { accessToken, refreshToken } = refreshJson.data;
            setToken(accessToken);
            setRefreshToken(refreshToken);
            await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
            await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
            console.log('[API] token refreshed successfully');
          } catch (err) {
            console.warn('[API] token refresh failed, clearing session:', err);
            setToken(null);
            setRefreshToken(null);
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
            throw err;
          } finally {
            _refreshPromise = null;
          }
        })();
      }

      try {
        await _refreshPromise;
        // Retry the original request with the new token
        return fetchApi<T>(path, options, true);
      } catch {
        // Refresh failed — fall through to throw the original 401
      }
    }
  }

  if (response.status === 204) {
    console.log(`[API] ← ${method} ${url} 204 No Content`);
    return undefined as T;
  }

  const json: ApiResponse<T> = await response.json();
  console.log(`[API] ← ${method} ${url} ${response.status}`, JSON.stringify(json).slice(0, 300));

  if (!json.success) {
    const code = json.error?.code ?? 'UNKNOWN_ERROR';
    const message = json.error?.message ?? 'An unexpected error occurred';
    console.error(`[API] ✗ ${method} ${url} → ${code}: ${message}`);
    throw new ApiError(code, message);
  }

  return json.data as T;
}

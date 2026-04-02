export const BASE_URL = 'http://localhost:3000';

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
// Simple in-memory store. Populated on login/register, cleared on logout.
// Will be upgraded to expo-secure-store when auth screens land.

let _token: string | null = null;

export function setToken(token: string | null): void {
  _token = token;
}

export function getToken(): string | null {
  return _token;
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
 * Throws ApiError on success:false responses or network failures.
 */
export async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
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

  const json: ApiResponse<T> = await response.json();
  console.log(`[API] ← ${method} ${url} ${response.status}`, JSON.stringify(json).slice(0, 300));

  if (!json.success || json.data === null) {
    const code = json.error?.code ?? 'UNKNOWN_ERROR';
    const message = json.error?.message ?? 'An unexpected error occurred';
    console.error(`[API] ✗ ${method} ${url} → ${code}: ${message}`);
    throw new ApiError(code, message);
  }

  return json.data;
}

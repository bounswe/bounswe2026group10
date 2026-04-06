import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { session } from '@/auth/session'
import { refreshSession } from '@/lib/refresh-session'

/**
 * Tek HTTP istemcisi. `npm run dev`: `.env.development` → `/api` + Vite proxy (localhost:3000).
 * `npm run build` / `npm run prod`: `.env.production` → tam backend URL.
 * Bearer token, login/register/refresh hariç isteklere eklenir.
 * 401: refresh token ile yenile, isteği bir kez tekrarla; refresh başarısızsa çıkış + `/login`.
 */
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
})

const PATHS_WITHOUT_BEARER = ['/auth/login', '/auth/register', '/auth/refresh']

/** Do not attempt token refresh for these paths (login/register/refresh/logout). */
const PATHS_SKIP_401_REFRESH = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
]

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let refreshPromise: Promise<void> | null = null

function shouldSkip401Refresh(url: string): boolean {
  return PATHS_SKIP_401_REFRESH.some((p) => url === p || url.endsWith(p))
}

async function runRefresh(): Promise<void> {
  const refreshToken = session.getTokens().refreshToken
  if (!refreshToken) {
    throw new Error('NO_REFRESH_TOKEN')
  }
  const tokens = await refreshSession(refreshToken)
  session.updateSessionTokens({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  })
}

function ensureRefresh(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = runRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

async function handleRefreshFailure(): Promise<void> {
  const { store } = await import('@/store/store')
  store.dispatch({ type: 'auth/logout' })
  window.location.replace('/login')
}

httpClient.interceptors.request.use((config) => {
  const url = config.url ?? ''
  const skipBearer = PATHS_WITHOUT_BEARER.some((p) => url === p || url.endsWith(p))
  if (!skipBearer) {
    const token = session.getTokens().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined
    if (!originalRequest) {
      return Promise.reject(error)
    }
    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }

    const url = originalRequest.url ?? ''
    if (shouldSkip401Refresh(url)) {
      return Promise.reject(error)
    }
    if (originalRequest._retry) {
      return Promise.reject(error)
    }

    try {
      await ensureRefresh()
    } catch {
      await handleRefreshFailure()
      return Promise.reject(error)
    }

    originalRequest._retry = true
    const token = session.getTokens().accessToken
    if (originalRequest.headers) {
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`
      } else {
        delete originalRequest.headers.Authorization
      }
    }
    return httpClient(originalRequest)
  }
)

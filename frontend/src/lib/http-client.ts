import axios from 'axios'
import { session } from '@/auth/session'

/**
 * Tek HTTP istemcisi. Geliştirmede `VITE_API_BASE_URL=/api` + Vite proxy ile backend’e yönlendirilir.
 * Bearer token, login/register/refresh hariç isteklere eklenir.
 */
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
})

const PATHS_WITHOUT_BEARER = ['/auth/login', '/auth/register', '/auth/refresh']

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

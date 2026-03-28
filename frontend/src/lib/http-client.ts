import axios from 'axios'

/**
 * Tek HTTP istemcisi. Geliştirmede `VITE_API_BASE_URL=/api` + Vite proxy ile backend’e yönlendirilir.
 * İleride: Authorization interceptor (token: auth/session).
 */
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
})

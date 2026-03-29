import axios from 'axios'

/**
 * No interceptors — must not use `httpClient` here (avoids 401 refresh recursion).
 * Only imported from `http-client.ts`.
 */
const rawClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
})

interface RefreshEnvelope {
  success: boolean
  data: {
    accessToken: string
    refreshToken: string
  }
}

export async function refreshSession(refreshToken: string): Promise<{
  accessToken: string
  refreshToken: string
}> {
  const { data } = await rawClient.post<RefreshEnvelope>('/auth/refresh', { refreshToken })
  return data.data
}

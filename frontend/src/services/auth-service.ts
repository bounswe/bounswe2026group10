import { httpClient } from '@/lib/http-client'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  username: string
  role: string
}

export interface AuthResponseData {
  userId: string
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  success: boolean
  data: AuthResponseData
}

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponseData> {
    const { data } = await httpClient.post<AuthResponse>('/auth/login', payload)
    return data.data
  },

  async register(payload: RegisterRequest): Promise<AuthResponseData> {
    const { data } = await httpClient.post<AuthResponse>('/auth/register', payload)
    return data.data
  },

  /** Invalidates server session (`POST /auth/logout`). Requires Bearer (interceptor). 204 No Content. */
  async logout(): Promise<void> {
    await httpClient.post('/auth/logout')
  },
}

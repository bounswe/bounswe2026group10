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
  /** Sent only when role='expert'. Backend stores it on the auto-created
   *  expert_requests row that the admin will review. */
  expertRequestReason?: string
}

export interface AuthResponseData {
  userId: string
  accessToken: string
  refreshToken: string
  /** True when the caller registered with role='expert' — the profile was
   *  actually created as 'cook' (interim) and the expert request is awaiting
   *  admin approval. Only present on `/auth/register` responses. */
  pendingExpertRequest?: boolean
  /** Mirrors `profile.role` after registration; useful when the caller asked
   *  for `expert` and the backend downgraded the response role to 'cook'. */
  role?: string
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

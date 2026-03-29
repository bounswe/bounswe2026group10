import { httpClient } from '@/lib/http-client'
import type { MeResponse } from '@/services/types/auth'

interface ApiEnvelope {
  success: boolean
  data: MeResponse
  error: null
}

export const profileService = {
  async getCurrentUser(): Promise<MeResponse> {
    const { data } = await httpClient.get<ApiEnvelope>('/auth/me')
    return data.data
  },
}

import { httpClient } from '@/lib/http-client'
import type { ExpertRequest } from '@/services/types/admin'

interface Envelope<T> {
  success: boolean
  data: T
  error: null | { code: string; message: string }
}

export const expertRequestService = {
  /** Submit a new expert-account request. Backend rejects if the caller
   *  already has a pending request (409 EXPERT_REQUEST_PENDING). */
  async submit(reason: string): Promise<ExpertRequest> {
    const { data } = await httpClient.post<Envelope<ExpertRequest>>('/auth/expert-requests', {
      reason,
    })
    return data.data
  },

  /** Returns the caller's most recent expert request (any status), or null. */
  async getMine(): Promise<ExpertRequest | null> {
    const { data } = await httpClient.get<Envelope<ExpertRequest | null>>(
      '/auth/expert-requests/me'
    )
    return data.data
  },
}

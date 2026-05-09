import { httpClient } from '@/lib/http-client'
import type {
  AdminUser,
  AdminUserList,
  AdminUserUpdate,
  ExpertRequest,
  ExpertRequestList,
  ExpertRequestStatus,
} from '@/services/types/admin'

interface Envelope<T> {
  success: boolean
  data: T
  error: null | { code: string; message: string }
}

interface ListExpertRequestsParams {
  status?: ExpertRequestStatus
  page?: number
  limit?: number
}

interface ListUsersParams {
  search?: string
  role?: AdminUser['role']
  page?: number
  limit?: number
}

interface DecisionPayload {
  decisionNote?: string
}

/** Strip empty values from a query object so axios doesn't serialize `?role=`. */
function compact<T extends object>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') {
      out[k] = v
    }
  }
  return out as Partial<T>
}

export const adminService = {
  // ── Expert account requests ────────────────────────────────────────────────

  async listExpertRequests(params: ListExpertRequestsParams = {}): Promise<ExpertRequestList> {
    const { data } = await httpClient.get<Envelope<ExpertRequestList>>('/admin/expert-requests', {
      params: compact(params),
    })
    return data.data
  },

  async approveExpertRequest(id: string, payload: DecisionPayload = {}): Promise<ExpertRequest> {
    const { data } = await httpClient.post<Envelope<ExpertRequest>>(
      `/admin/expert-requests/${id}/approve`,
      payload
    )
    return data.data
  },

  async rejectExpertRequest(id: string, payload: DecisionPayload = {}): Promise<ExpertRequest> {
    const { data } = await httpClient.post<Envelope<ExpertRequest>>(
      `/admin/expert-requests/${id}/reject`,
      payload
    )
    return data.data
  },

  // ── Users ──────────────────────────────────────────────────────────────────

  async listUsers(params: ListUsersParams = {}): Promise<AdminUserList> {
    const { data } = await httpClient.get<Envelope<AdminUserList>>('/admin/users', {
      params: compact(params),
    })
    return data.data
  },

  async updateUser(id: string, payload: AdminUserUpdate): Promise<AdminUser> {
    const { data } = await httpClient.patch<Envelope<AdminUser>>(`/admin/users/${id}`, payload)
    return data.data
  },

  async deleteUser(id: string): Promise<void> {
    await httpClient.delete(`/admin/users/${id}`)
  },

  // ── Recipes / Comments (moderation) ────────────────────────────────────────

  async deleteRecipe(id: string): Promise<void> {
    await httpClient.delete(`/admin/recipes/${id}`)
  },

  async deleteComment(id: number | string): Promise<void> {
    await httpClient.delete(`/admin/comments/${id}`)
  },
}

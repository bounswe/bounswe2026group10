import { httpClient } from '@/lib/http-client'
import type { MeResponse } from '@/services/types/auth'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  error: null
}

/** Fields the user can edit on their own profile. All optional — only sent
 *  fields are updated. `avatarUrl` is a fully-qualified URL returned from
 *  `POST /media/upload`. */
export interface ProfileUpdatePayload {
  username?: string
  bio?: string
  avatarUrl?: string
  region?: string
  preferredLanguage?: string
}

/** Shape of the row PATCH /auth/profile returns. Backend uses snake_case;
 *  we normalize to camelCase on the way out. */
export interface UpdatedProfile {
  id: string
  username: string
  bio: string | null
  avatarUrl: string | null
  region: string | null
  preferredLanguage: string | null
  updatedAt: string
}

interface UpdatedProfileRow {
  id: string | number
  username: string
  bio: string | null
  avatar_url: string | null
  region: string | null
  preferred_language: string | null
  updated_at: string
}

export const profileService = {
  async getCurrentUser(): Promise<MeResponse> {
    const { data } = await httpClient.get<ApiEnvelope<MeResponse>>('/auth/me')
    return data.data
  },

  /** PATCH /auth/profile — partial update. Returns 409 if username taken. */
  async updateProfile(payload: ProfileUpdatePayload): Promise<UpdatedProfile> {
    const body: Record<string, string> = {}
    if (payload.username !== undefined) body.username = payload.username
    if (payload.bio !== undefined) body.bio = payload.bio
    if (payload.avatarUrl !== undefined) body.avatar_url = payload.avatarUrl
    if (payload.region !== undefined) body.region = payload.region
    if (payload.preferredLanguage !== undefined) body.preferred_language = payload.preferredLanguage

    const { data } = await httpClient.patch<ApiEnvelope<UpdatedProfileRow>>('/auth/profile', body)
    const row = data.data
    return {
      id: String(row.id),
      username: row.username,
      bio: row.bio,
      avatarUrl: row.avatar_url,
      region: row.region,
      preferredLanguage: row.preferred_language,
      updatedAt: row.updated_at,
    }
  },
}

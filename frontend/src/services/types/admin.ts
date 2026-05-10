import type { UserRole } from '@/services/types/auth'

/** Status of an `expert_requests` row, mirrors backend CHECK constraint. */
export type ExpertRequestStatus = 'pending' | 'approved' | 'rejected'

/** A single expert-account request. Matches `GET /admin/expert-requests` items
 *  and `GET /auth/expert-requests/me`. Date fields are ISO strings. */
export interface ExpertRequest {
  id: string
  userId: string
  reason: string | null
  status: ExpertRequestStatus
  decisionNote: string | null
  decidedBy: string | null
  createdAt: string
  decidedAt: string | null
  /** Only present on the admin listing endpoint. */
  applicant?: {
    id: string
    username: string
    role: UserRole
  } | null
}

/** Page envelope returned by `GET /admin/expert-requests`. */
export interface ExpertRequestList {
  requests: ExpertRequest[]
  pagination: { page: number; limit: number; total: number }
}

/** A profile row as returned by `GET /admin/users`. Backend snake_case is
 *  preserved here because the listing endpoint mirrors the column names. */
export interface AdminUser {
  id: string
  user_id: string
  username: string
  role: UserRole
  region: string | null
  preferred_language: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface AdminUserList {
  users: AdminUser[]
  pagination: { page: number; limit: number; total: number }
}

/** Body for `PATCH /admin/users/:id`. The backend rejects role='admin'. */
export interface AdminUserUpdate {
  username?: string
  role?: Exclude<UserRole, 'admin'>
  bio?: string
  region?: string
  preferred_language?: string
}

// ── Cultural tag requests ──────────────────────────────────────────────────────

export type CulturalTagRequestStatus = 'pending' | 'approved' | 'rejected'

export interface CulturalTagRequest {
  id: number
  labelEn: string | null
  labelTr: string | null
  country: string | null
  status: CulturalTagRequestStatus
  decisionNote: string | null
  decidedBy: string | null
  createdAt: string
  decidedAt: string | null
  requester: { id: string; username: string } | null
}

export interface CulturalTagRequestList {
  requests: CulturalTagRequest[]
  pagination: { page: number; limit: number; total: number }
}

export interface ApproveCulturalTagPayload {
  labelEn?: string
  labelTr?: string
  country?: string
  decisionNote?: string
}

// ── Dish genre requests ────────────────────────────────────────────────────────

export type ContentRequestStatus = 'pending' | 'approved' | 'rejected'

export interface DishGenreRequest {
  id: number
  nameEn: string | null
  nameTr: string | null
  descriptionEn: string | null
  descriptionTr: string | null
  status: ContentRequestStatus
  decisionNote: string | null
  decidedBy: string | null
  createdAt: string
  decidedAt: string | null
  requester: { id: string; username: string } | null
}

export interface DishGenreRequestList {
  requests: DishGenreRequest[]
  pagination: { page: number; limit: number; total: number }
}

export interface ApproveDishGenrePayload {
  nameEn?: string
  nameTr?: string
  descriptionEn?: string
  descriptionTr?: string
  decisionNote?: string
}

// ── Dish variety requests ──────────────────────────────────────────────────────

export interface DishVarietyRequest {
  id: number
  genreId: number
  nameEn: string | null
  nameTr: string | null
  descriptionEn: string | null
  descriptionTr: string | null
  status: ContentRequestStatus
  decisionNote: string | null
  decidedBy: string | null
  createdAt: string
  decidedAt: string | null
  requester: { id: string; username: string } | null
}

export interface DishVarietyRequestList {
  requests: DishVarietyRequest[]
  pagination: { page: number; limit: number; total: number }
}

export interface ApproveDishVarietyPayload {
  nameEn?: string
  nameTr?: string
  descriptionEn?: string
  descriptionTr?: string
  genreId?: number
  decisionNote?: string
}

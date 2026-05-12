import { httpClient } from '@/lib/http-client'
import type {
  CulturalTagRequest,
  DishGenreRequest,
  DishVarietyRequest,
} from '@/services/types/admin'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  error: null
}

/** Shape returned by `/<resource>/requests/me` — same as the admin types but
 * `requester` is not joined back to the caller (we already know it's us). */
type MyCulturalTagRequest = Omit<CulturalTagRequest, 'requester'>
type MyDishGenreRequest = Omit<DishGenreRequest, 'requester'>
type MyDishVarietyRequest = Omit<DishVarietyRequest, 'requester'>

// ── Cultural tag suggestions ────────────────────────────────────────────────

export interface CreateCulturalTagRequestPayload {
  labelEn?: string
  labelTr?: string
  country?: string
}

function normalizeCulturalTagRequest(row: any): MyCulturalTagRequest {
  return {
    id: Number(row.id),
    labelEn: row.labelEn ?? null,
    labelTr: row.labelTr ?? null,
    country: row.country ?? null,
    status: row.status,
    decisionNote: row.decisionNote ?? null,
    decidedBy: row.decidedBy ?? null,
    createdAt: row.createdAt ?? '',
    decidedAt: row.decidedAt ?? null,
  }
}

export const culturalTagRequest = {
  create: async (
    payload: CreateCulturalTagRequestPayload,
  ): Promise<MyCulturalTagRequest> => {
    const { data } = await httpClient.post<ApiEnvelope<MyCulturalTagRequest>>(
      '/cultural-tags/requests',
      payload,
    )
    return normalizeCulturalTagRequest(data.data)
  },
  listMine: async (): Promise<MyCulturalTagRequest[]> => {
    const { data } = await httpClient.get<ApiEnvelope<MyCulturalTagRequest[]>>(
      '/cultural-tags/requests/me',
    )
    return (Array.isArray(data.data) ? data.data : []).map(normalizeCulturalTagRequest)
  },
}

// ── Dish genre suggestions ──────────────────────────────────────────────────

export interface CreateDishGenreRequestPayload {
  nameEn?: string
  nameTr?: string
  descriptionEn?: string
  descriptionTr?: string
}

function normalizeDishGenreRequest(row: any): MyDishGenreRequest {
  return {
    id: Number(row.id),
    nameEn: row.nameEn ?? null,
    nameTr: row.nameTr ?? null,
    descriptionEn: row.descriptionEn ?? null,
    descriptionTr: row.descriptionTr ?? null,
    status: row.status,
    decisionNote: row.decisionNote ?? null,
    decidedBy: row.decidedBy ?? null,
    createdAt: row.createdAt ?? '',
    decidedAt: row.decidedAt ?? null,
  }
}

export const dishGenreRequest = {
  create: async (
    payload: CreateDishGenreRequestPayload,
  ): Promise<MyDishGenreRequest> => {
    const { data } = await httpClient.post<ApiEnvelope<MyDishGenreRequest>>(
      '/dish-genres/requests',
      payload,
    )
    return normalizeDishGenreRequest(data.data)
  },
  listMine: async (): Promise<MyDishGenreRequest[]> => {
    const { data } = await httpClient.get<ApiEnvelope<MyDishGenreRequest[]>>(
      '/dish-genres/requests/me',
    )
    return (Array.isArray(data.data) ? data.data : []).map(normalizeDishGenreRequest)
  },
}

// ── Dish variety suggestions ────────────────────────────────────────────────

export interface CreateDishVarietyRequestPayload {
  genreId: number
  nameEn?: string
  nameTr?: string
  descriptionEn?: string
  descriptionTr?: string
}

function normalizeDishVarietyRequest(row: any): MyDishVarietyRequest {
  return {
    id: Number(row.id),
    genreId: Number(row.genreId),
    nameEn: row.nameEn ?? null,
    nameTr: row.nameTr ?? null,
    descriptionEn: row.descriptionEn ?? null,
    descriptionTr: row.descriptionTr ?? null,
    status: row.status,
    decisionNote: row.decisionNote ?? null,
    decidedBy: row.decidedBy ?? null,
    createdAt: row.createdAt ?? '',
    decidedAt: row.decidedAt ?? null,
  }
}

export const dishVarietyRequest = {
  create: async (
    payload: CreateDishVarietyRequestPayload,
  ): Promise<MyDishVarietyRequest> => {
    const { data } = await httpClient.post<ApiEnvelope<MyDishVarietyRequest>>(
      '/dish-varieties/requests',
      payload,
    )
    return normalizeDishVarietyRequest(data.data)
  },
  listMine: async (): Promise<MyDishVarietyRequest[]> => {
    const { data } = await httpClient.get<ApiEnvelope<MyDishVarietyRequest[]>>(
      '/dish-varieties/requests/me',
    )
    return (Array.isArray(data.data) ? data.data : []).map(normalizeDishVarietyRequest)
  },
}

export type {
  MyCulturalTagRequest,
  MyDishGenreRequest,
  MyDishVarietyRequest,
}

import { httpClient } from '@/lib/http-client'

/** API success envelope from `backend/src/utils/response.ts` */
interface ApiEnvelope<T> {
  success: boolean
  data: T
  error: null
}

/** Normalized row after `POST /recipes/:id/ratings` (Supabase snake_case mapped). */
export interface UserRating {
  id: string
  recipeId: string
  userId: string
  score: number
  createdAt: string
  updatedAt: string
}

/** Normalized row from `GET /recipes/:id/ratings/me` when a rating exists. */
export interface MyRating {
  id: string
  score: number
  createdAt: string
  updatedAt: string
}

/** Raw `data` from `POST /recipes/:id/ratings` (Supabase column names). */
interface RatingSubmitRow {
  id: string | number
  recipe_id: string
  user_id: string
  score: number
  created_at: string
  updated_at: string
}

/** Raw `data` from `GET /recipes/:id/ratings/me` when not null. */
interface RatingMeRow {
  id: string | number
  score: number
  created_at: string
  updated_at: string
}

function mapSubmitPayload(row: RatingSubmitRow): UserRating {
  return {
    id: String(row.id),
    recipeId: String(row.recipe_id),
    userId: String(row.user_id),
    score: Number(row.score),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  }
}

function mapMyPayload(row: RatingMeRow): MyRating {
  return {
    id: String(row.id),
    score: Number(row.score),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  }
}

export const ratingService = {
  /**
   * Submit or update the current user's 1–5 star rating for a recipe.
   * `POST /recipes/:id/ratings` — requires auth; 403 if rating own recipe.
   */
  async submitRating(recipeId: string, score: number): Promise<UserRating> {
    const { data } = await httpClient.post<ApiEnvelope<RatingSubmitRow>>(
      `/recipes/${recipeId}/ratings`,
      { score }
    )
    return mapSubmitPayload(data.data)
  },

  /**
   * Current user's rating for this recipe, or `null` if none.
   * `GET /recipes/:id/ratings/me` — requires auth.
   */
  async getMyRating(recipeId: string): Promise<MyRating | null> {
    const { data } = await httpClient.get<ApiEnvelope<RatingMeRow | null>>(
      `/recipes/${recipeId}/ratings/me`
    )
    if (data.data == null) {
      return null
    }
    return mapMyPayload(data.data)
  },

  /**
   * Remove the current user's rating. `DELETE /recipes/:id/ratings/me` — 204 No Content.
   */
  async deleteMyRating(recipeId: string): Promise<void> {
    await httpClient.delete(`/recipes/${recipeId}/ratings/me`)
  },
}

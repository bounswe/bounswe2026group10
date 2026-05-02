import { httpClient } from '@/lib/http-client'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  error: null
}

interface AddFavoriteRow {
  recipeId: string
  favorited: boolean
}

export interface FavoriteRecipe {
  id: string
  title: string
  type: 'cultural' | 'community'
  averageRating: number | null
  ratingCount: number
  creatorUsername: string | null
  dishVarietyName: string | null
  genreName: string | null
  coverImageUrl: string | null
  createdAt: string
}

interface FavoritesData {
  recipes: FavoriteRecipe[]
  pagination: { page: number; limit: number; total: number }
}

export const favoriteService = {
  async add(recipeId: string): Promise<void> {
    await httpClient.post<ApiEnvelope<AddFavoriteRow>>(
      `/users/me/favorites/${recipeId}`
    )
  },

  async remove(recipeId: string): Promise<void> {
    await httpClient.delete(`/users/me/favorites/${recipeId}`)
  },

  async list(page = 1, limit = 20): Promise<FavoritesData> {
    const { data } = await httpClient.get<ApiEnvelope<FavoritesData>>(
      '/users/me/favorites',
      { params: { page, limit } }
    )
    return data.data
  },
}

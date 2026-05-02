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

export const favoriteService = {
  async add(recipeId: string): Promise<void> {
    await httpClient.post<ApiEnvelope<AddFavoriteRow>>(
      `/users/me/favorites/${recipeId}`
    )
  },

  async remove(recipeId: string): Promise<void> {
    await httpClient.delete(`/users/me/favorites/${recipeId}`)
  },
}

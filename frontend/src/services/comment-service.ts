import { httpClient } from '@/lib/http-client'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  error: null
}

export interface Comment {
  id: string
  recipeId: string
  userId: string
  username: string
  body: string
  score: number | null
  createdAt: string
  updatedAt: string
}

export interface CommentsPage {
  comments: Comment[]
  pagination: { page: number; limit: number; total: number }
}

export const commentService = {
  async list(recipeId: string, page = 1, limit = 20): Promise<CommentsPage> {
    const { data } = await httpClient.get<ApiEnvelope<CommentsPage>>(
      `/recipes/${recipeId}/comments`,
      { params: { page, limit } }
    )
    return data.data
  },

  async create(recipeId: string, body: string, score?: number): Promise<Comment> {
    const { data } = await httpClient.post<
      ApiEnvelope<{
        comment: Omit<Comment, 'score'>
        rating: { score: number } | null
      }>
    >(
      `/recipes/${recipeId}/comments`,
      { body, ...(score !== undefined ? { score } : {}) }
    )
    return { ...data.data.comment, score: data.data.rating?.score ?? null }
  },

  async remove(commentId: string): Promise<void> {
    await httpClient.delete(`/comments/${commentId}`)
  },

  async edit(commentId: string, body: string): Promise<Comment> {
    const { data } = await httpClient.patch<ApiEnvelope<Comment>>(
      `/comments/${commentId}`,
      { body }
    )
    return data.data
  },
}

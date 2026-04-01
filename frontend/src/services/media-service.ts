import { httpClient } from '@/lib/http-client'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  error: null
}

type MediaType = 'image' | 'video'

export interface UploadedMedia {
  url: string
  type: MediaType
  size: number
}

export interface RecipeMediaAttachment {
  id: string
  url: string
  type: MediaType
  createdAt: string
}

interface RecipeMediaAttachmentRow {
  id: string | number
  url: string
  type: MediaType
  created_at: string
}

export const mediaService = {
  /**
   * POST /media/upload
   * multipart/form-data (file field name: `file`)
   */
  uploadFile: async (file: File): Promise<UploadedMedia> => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await httpClient.post<ApiEnvelope<UploadedMedia>>('/media/upload', formData)
    const d = res.data?.data
    return {
      url: d?.url ?? '',
      type: d?.type === 'video' ? 'video' : 'image',
      size: Number(d?.size ?? 0),
    }
  },

  /**
   * POST /recipes/:id/media
   */
  attachRecipeMedia: async (
    recipeId: string,
    payload: { url: string; type: MediaType }
  ): Promise<RecipeMediaAttachment> => {
    const res = await httpClient.post<ApiEnvelope<RecipeMediaAttachmentRow>>(
      `/recipes/${recipeId}/media`,
      payload
    )
    const d = res.data?.data
    return {
      id: String(d?.id ?? ''),
      url: d?.url ?? payload.url,
      type: d?.type === 'video' ? 'video' : 'image',
      createdAt: d?.created_at ?? new Date().toISOString(),
    }
  },

  /**
   * DELETE /recipes/:id/media/:mediaId
   */
  deleteRecipeMedia: async (recipeId: string, mediaId: string): Promise<void> => {
    await httpClient.delete(`/recipes/${recipeId}/media/${mediaId}`)
  },
}

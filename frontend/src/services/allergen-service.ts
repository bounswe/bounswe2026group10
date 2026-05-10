import { httpClient } from '@/lib/http-client'

export interface Allergen {
  id: number
  name: string
}

export const allergenService = {
  /** GET /allergens — full allergen list from the allergens table. */
  list: async (): Promise<Allergen[]> => {
    const res = await httpClient.get('/allergens')
    const raw: unknown[] = Array.isArray(res.data?.data) ? res.data.data : []
    return raw.map((a: any) => ({ id: Number(a.id), name: a.name ?? '' }))
  },

  /**
   * POST /allergens/detect — given a list of ingredient IDs, returns the
   * allergens present in those ingredients (via ingredient_allergens table).
   */
  detect: async (ingredientIds: number[]): Promise<Allergen[]> => {
    if (ingredientIds.length === 0) return []
    const res = await httpClient.post('/allergens/detect', { ingredientIds })
    const raw: unknown[] = Array.isArray(res.data?.data) ? res.data.data : []
    return raw.map((a: any) => ({ id: Number(a.id), name: a.name ?? '' }))
  },
}

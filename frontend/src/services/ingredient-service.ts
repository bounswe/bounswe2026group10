import { httpClient } from '@/lib/http-client'

export interface IngredientOption {
  id: number
  name: string
}

export const ingredientService = {
  /**
   * GET /ingredients — optional `search` for partial case-insensitive name match.
   */
  search: async (search?: string): Promise<IngredientOption[]> => {
    const params = search?.trim() ? { search: search.trim() } : undefined
    const res = await httpClient.get('/ingredients', { params })
    const raw: unknown[] = Array.isArray(res.data?.data) ? res.data.data : []
    return raw.map((row) => {
      const r = row as { id?: unknown; name?: unknown }
      return {
        id: Number(r.id),
        name: String(r.name ?? ''),
      }
    })
  },

  /**
   * POST /ingredients — create a new ingredient (cook/expert only).
   * Throws with code CONFLICT (409) if name already exists.
   */
  create: async (name: string): Promise<IngredientOption> => {
    const res = await httpClient.post('/ingredients', { name })
    const data = res.data?.data as { id?: unknown; name?: unknown }
    return {
      id: Number(data.id),
      name: String(data.name ?? ''),
    }
  },
}

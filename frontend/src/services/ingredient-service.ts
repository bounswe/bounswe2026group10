import { httpClient } from '@/lib/http-client'

export interface IngredientOption {
  id: number
  name: string
}

export interface IngredientSubstitution {
  ingredient: { id: number; name: string }
  amount: number
  unit: string
  confidence: number
  description: string | null
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
   * GET /ingredients/:id/substitutions — returns substitute suggestions.
   * Pass amount + unit to get proportionally scaled substitute amounts.
   */
  getSubstitutions: async (id: string, amount?: number, unit?: string): Promise<IngredientSubstitution[]> => {
    const params: Record<string, string | number> = {}
    if (amount !== undefined) params.amount = amount
    if (unit) params.unit = unit
    const res = await httpClient.get(`/ingredients/${id}/substitutions`, { params })
    const raw: unknown[] = Array.isArray(res.data?.data) ? res.data.data : []
    return raw.map((row) => {
      const r = row as any
      return {
        ingredient: { id: Number(r.ingredient?.id), name: String(r.ingredient?.name ?? '') },
        amount: Number(r.amount),
        unit: String(r.unit ?? ''),
        confidence: Number(r.confidence ?? 0),
        description: r.description ? String(r.description) : null,
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

import { httpClient } from '@/lib/http-client'

export const unitService = {
  /**
   * GET /units — optional `search` for partial case-insensitive match.
   * Returns distinct unit strings from recipe_ingredients.
   */
  search: async (search?: string): Promise<string[]> => {
    const params = search?.trim() ? { search: search.trim() } : undefined
    const res = await httpClient.get('/units', { params })
    const raw: unknown[] = Array.isArray(res.data?.data) ? res.data.data : []
    return raw
      .map((row) => {
        const r = row as { unit?: unknown }
        return String(r.unit ?? '').trim()
      })
      .filter(Boolean)
  },
}

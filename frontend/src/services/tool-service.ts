import { httpClient } from '@/lib/http-client'

export interface ToolOption {
  name: string
}

export const toolService = {
  /**
   * GET /tools — optional `search` for partial case-insensitive name match.
   * Returns distinct tool names from recipe_tools.
   */
  search: async (search?: string): Promise<ToolOption[]> => {
    const params = search?.trim() ? { search: search.trim() } : undefined
    const res = await httpClient.get('/tools', { params })
    const raw: unknown[] = Array.isArray(res.data?.data) ? res.data.data : []
    return raw
      .map((row) => {
        const r = row as { name?: unknown }
        return { name: String(r.name ?? '').trim() }
      })
      .filter((r) => r.name.length > 0)
  },
}

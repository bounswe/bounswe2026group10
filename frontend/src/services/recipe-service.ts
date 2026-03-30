import { httpClient } from '@/lib/http-client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreateRecipePayload {
  title: string
  story?: string
  type: 'community' | 'cultural'
  dishVarietyId?: number
  servingSize?: number
  /** Backend requires {stepOrder, description}[]; sent directly. */
  steps: { stepOrder: number; description: string }[]
  /** Backend requires {name}[]. */
  tools: { name: string }[]
  /**
   * Pass true to publish immediately on creation.
   * Note: the separate POST /recipes/:id/publish endpoint enforces completeness
   * (dishVarietyId, servingSize, ≥1 ingredient, ≥1 step). Using isPublished:true
   * here bypasses that check — suitable for MVP where ingredient IDs are not yet
   * collected (no GET /ingredients lookup endpoint exists).
   */
  isPublished: boolean
}

export interface CreatedRecipe {
  id: string
  title: string
  type: 'community' | 'cultural'
  isPublished: boolean
  createdAt: string
}

// ── Service ───────────────────────────────────────────────────────────────────

export const recipeService = {
  /**
   * POST /recipes — create a new recipe (draft or published).
   * Requires cook or expert role (enforced by backend).
   */
  create: async (payload: CreateRecipePayload): Promise<CreatedRecipe> => {
    const res = await httpClient.post('/recipes', payload)
    const d = res.data?.data
    return {
      id: String(d.id),
      title: d.title ?? payload.title,
      type: d.type ?? payload.type,
      isPublished: d.isPublished ?? payload.isPublished,
      createdAt: d.createdAt ?? new Date().toISOString(),
    }
  },
}

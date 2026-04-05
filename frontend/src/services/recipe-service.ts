import { httpClient } from '@/lib/http-client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RecipeIngredient {
  id: string
  ingredientId: string | null
  ingredientName: string | null
  quantity: number
  unit: string
  allergens: string[]
}

export interface ScaledRecipeIngredient {
  id: string
  ingredientId: string | null
  ingredientName: string | null
  quantity: number
  unit: string
  allergens: string[]
}

export interface RecipeStep {
  id: string
  stepOrder: number
  description: string
}

export interface RecipeTool {
  id: string
  name: string
}

export interface RecipeMedia {
  id: string
  url: string
  type: 'image' | 'video'
}

export interface RecipeDetail {
  id: string
  title: string
  story: string | null
  videoUrl: string | null
  servingSize: number | null
  type: 'community' | 'cultural'
  isPublished: boolean
  averageRating: number | null
  ratingCount: number
  creatorId: string | null
  creatorUsername: string | null
  dishVarietyId: string | null
  dishVarietyName: string | null
  genreName: string | null
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  tools: RecipeTool[]
  media: RecipeMedia[]
  createdAt: string
  updatedAt: string
}

export interface CreateRecipeIngredient {
  ingredientId: number
  quantity: number
  unit: string
}

export interface CreateRecipePayload {
  title: string
  story?: string
  type: 'community' | 'cultural'
  dishVarietyId?: number
  servingSize?: number
  /** Backend: recipe_ingredients rows with FK to ingredients.id */
  ingredients?: CreateRecipeIngredient[]
  /** Backend requires {stepOrder, description}[]; sent directly. */
  steps: { stepOrder: number; description: string }[]
  /** Backend requires {name}[]. */
  tools: { name: string }[]
  /**
   * Pass true to publish immediately on creation.
   * Note: the separate POST /recipes/:id/publish endpoint enforces completeness
   * (dishVarietyId, servingSize, ≥1 ingredient, ≥1 step). Using isPublished:true
   * here bypasses that check when needed for draft flows.
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
   * GET /recipes/:id — full recipe detail including ingredients, steps, tools, media.
   * Published recipes are public; unpublished only visible to creator.
   */
  getById: async (id: string): Promise<RecipeDetail> => {
    const res = await httpClient.get(`/recipes/${id}`)
    const d = res.data?.data
    return {
      id: String(d.id),
      title: d.title ?? '',
      story: d.story ?? null,
      videoUrl: d.videoUrl ?? null,
      servingSize: d.servingSize ?? null,
      type: d.type === 'cultural' ? 'cultural' : 'community',
      isPublished: d.isPublished ?? false,
      averageRating: d.averageRating ?? null,
      ratingCount: d.ratingCount ?? 0,
      creatorId: d.creatorId ? String(d.creatorId) : null,
      creatorUsername: d.creatorUsername ?? null,
      dishVarietyId: d.dishVarietyId ? String(d.dishVarietyId) : null,
      dishVarietyName: d.dishVarietyName ?? null,
      genreName: d.genreName ?? null,
      ingredients: (d.ingredients ?? []).map((i: any) => ({
        id: String(i.id),
        ingredientId: i.ingredientId ? String(i.ingredientId) : null,
        ingredientName: i.ingredientName ?? null,
        quantity: i.quantity,
        unit: i.unit,
        allergens: i.allergens ?? [],
      })),
      steps: (d.steps ?? []).map((s: any) => ({
        id: String(s.id),
        stepOrder: s.stepOrder,
        description: s.description,
      })),
      tools: (d.tools ?? []).map((t: any) => ({
        id: String(t.id),
        name: t.name,
      })),
      media: (d.media ?? []).map((m: any) => ({
        id: String(m.id),
        url: m.url,
        type: m.type,
      })),
      createdAt: d.createdAt ?? '',
      updatedAt: d.updatedAt ?? '',
    }
  },

  /**
   * GET /recipes/:id/scale?servings=N — returns ingredient quantities scaled to the desired serving count.
   */
  scale: async (id: string, servings: number): Promise<ScaledRecipeIngredient[]> => {
    const res = await httpClient.get(`/recipes/${id}/scale`, { params: { servings } })
    const d = res.data?.data
    return (d.ingredients ?? []).map((i: any) => ({
      id: String(i.id),
      ingredientId: i.ingredientId ? String(i.ingredientId) : null,
      ingredientName: i.ingredientName ?? null,
      quantity: Number(i.quantity),
      unit: String(i.unit ?? ''),
      allergens: i.allergens ?? [],
    }))
  },

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

import { httpClient } from '@/lib/http-client'
import type { CulturalTag } from '@/services/cultural-tag-service'

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
  videoTimestamp: number | null
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

export interface VideoAnnotation {
  id: string
  recipeId: string
  startTime: number
  endTime: number
  note: string
  technique: string | null
  createdAt: string
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
  country: string | null
  city: string | null
  district: string | null
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  tools: RecipeTool[]
  media: RecipeMedia[]
  tags: { id: string; name: string; category: 'dietary' | 'allergen' }[]
  culturalTags: CulturalTag[]
  videoAnnotations: VideoAnnotation[]
  createdAt: string
  updatedAt: string
  isFavorited: boolean
}

export interface UpdateRecipePayload {
  title?: string
  story?: string
  type?: 'community' | 'cultural'
  dishVarietyId?: number
  servingSize?: number
  country?: string
  city?: string
  district?: string
  ingredients?: CreateRecipeIngredient[]
  steps?: { stepOrder: number; description: string }[]
  tools?: { name: string }[]
  /** Cultural tag IDs from GET /cultural-tags (cultural recipes only). */
  culturalTagIds?: number[]
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
  country?: string
  city?: string
  district?: string
  /** Dietary + allergen tag IDs from GET /dietary-tags */
  tagIds?: number[]
  /** Allergen IDs from GET /allergens — auto-detected from ingredients */
  allergenIds?: number[]
  /** Cultural tag IDs from GET /cultural-tags (cultural recipes only). */
  culturalTagIds?: number[]
}

export interface CreatedRecipe {
  id: string
  title: string
  type: 'community' | 'cultural'
  isPublished: boolean
  createdAt: string
}

export interface MyRecipeSummary {
  id: string
  title: string
  type: 'community' | 'cultural'
  isPublished: boolean
  averageRating: number | null
  ratingCount: number
  country: string | null
  city: string | null
  district: string | null
  createdAt: string
  updatedAt: string
  coverImageUrl: string | null
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
        videoTimestamp: typeof s.videoTimestamp === 'number' ? s.videoTimestamp : null,
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
      tags: (d.tags ?? []).map((tag: any) => ({
        id: String(tag.id),
        name: tag.name ?? '',
        category: tag.category === 'allergen' ? 'allergen' : 'dietary',
      })),
      culturalTags: (d.culturalTags ?? []).map((t: any) => ({
        id: Number(t.id),
        key: String(t.key ?? ''),
        labelEn: t.labelEn ?? null,
        labelTr: t.labelTr ?? null,
        country: t.country ?? null,
      })),
      videoAnnotations: (d.videoAnnotations ?? []).map((a: any) => ({
        id: String(a.id),
        recipeId: String(a.recipeId ?? a.recipe_id ?? ''),
        startTime: Number(a.startTime ?? a.start_time ?? 0),
        endTime: Number(a.endTime ?? a.end_time ?? 0),
        note: String(a.note ?? ''),
        technique: a.technique ?? null,
        createdAt: a.createdAt ?? a.created_at ?? '',
      })),
      country: d.country ?? null,
      city: d.city ?? null,
      district: d.district ?? null,
      createdAt: d.createdAt ?? '',
      updatedAt: d.updatedAt ?? '',
      isFavorited: d.isFavorited ?? false,
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
   * PATCH /recipes/:id — update an existing recipe (draft or published, creator only).
   */
  update: async (id: string, payload: UpdateRecipePayload): Promise<void> => {
    await httpClient.patch(`/recipes/${id}`, payload)
  },

  /**
   * GET /users/me/drafts — list unpublished recipes belonging to the authenticated user.
   */
  listDrafts: async (): Promise<MyRecipeSummary[]> => {
    const res = await httpClient.get('/users/me/drafts')
    const raw: unknown[] = Array.isArray(res.data?.data) ? res.data.data : []
    return raw.map((r: any) => ({
      id: String(r.id),
      title: r.title ?? '',
      type: r.type === 'cultural' ? 'cultural' : 'community',
      isPublished: r.isPublished ?? false,
      averageRating: r.averageRating ?? null,
      ratingCount: r.ratingCount ?? 0,
      country: r.country ?? null,
      city: r.city ?? null,
      district: r.district ?? null,
      createdAt: r.createdAt ?? '',
      updatedAt: r.updatedAt ?? '',
      coverImageUrl: r.coverImageUrl ?? null,
    }))
  },

  /**
   * GET /recipes/mine — list all recipes belonging to the authenticated user.
   * Optional status filter: 'published' | 'draft'
   */
  getMyRecipes: async (status?: 'published' | 'draft'): Promise<MyRecipeSummary[]> => {
    const params = status ? { status } : undefined
    const res = await httpClient.get('/recipes/mine', { params })
    const raw: unknown[] = Array.isArray(res.data?.data) ? res.data.data : []
    return raw.map((r: any) => ({
      id: String(r.id),
      title: r.title ?? '',
      type: r.type === 'cultural' ? 'cultural' : 'community',
      isPublished: r.isPublished ?? false,
      averageRating: r.averageRating ?? null,
      ratingCount: r.ratingCount ?? 0,
      country: r.country ?? null,
      city: r.city ?? null,
      district: r.district ?? null,
      createdAt: r.createdAt ?? '',
      updatedAt: r.updatedAt ?? '',
      coverImageUrl: r.coverImageUrl ?? null,
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

  /**
   * POST /recipes/:id/publish — publish a draft (creator only; completeness enforced).
   */
  publish: async (id: string): Promise<void> => {
    await httpClient.post(`/recipes/${id}/publish`)
  },

  /**
   * DELETE /recipes/:id — delete recipe and related data (creator only).
   */
  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/recipes/${id}`)
  },
}

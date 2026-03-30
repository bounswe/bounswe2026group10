import { httpClient } from '@/lib/http-client'

// ── Public types (camelCase — used by components) ────────────────────────────

export interface Genre {
  id: string
  name: string
  imageUrl?: string
}

export interface DishVariety {
  id: string
  name: string
  genreId: string
  genre?: { id: string; name: string }
  region?: string
  recipeCount?: number
  imageUrl?: string
}

export interface VarietyRecipeSummary {
  id: string
  title: string
  type: 'community' | 'cultural'
  averageRating: number | null
  ratingCount: number
  region: string | null
  createdAt: string
}

export interface DishVarietyDetail {
  id: string
  name: string
  description: string | null
  genreId: string
  genre: { id: string; name: string } | null
  recipes: VarietyRecipeSummary[]
}

export interface RecipeSummary {
  id: string
  title: string
  recipeType: 'community' | 'cultural'
  region?: string
  averageRating?: number
  ratingCount?: number
  createdAt?: string
  imageUrl?: string
  author: { username: string; role?: string }
  variety?: { id: string; name: string }
  genre?: { id: string; name: string }
}

export interface DiscoveryParams {
  region?: string
  excludeAllergens?: string
  genreId?: number
  varietyId?: number
  page?: number
  limit?: number
}

// ── Normalizers: map backend snake_case → our camelCase types ────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRecipe(r: any): RecipeSummary {
  return {
    id: String(r.id),
    title: r.title ?? '',
    recipeType: r.type === 'cultural' ? 'cultural' : 'community',
    region: r.dish_variety?.region ?? undefined,
    averageRating: r.average_rating ?? undefined,
    ratingCount: r.rating_count ?? undefined,
    createdAt: r.created_at ?? undefined,
    imageUrl: r.image_url ?? undefined,
    author: {
      username: r.profile?.username ?? 'Unknown',
      role: r.profile?.role ?? undefined,
    },
    variety: r.dish_variety
      ? { id: String(r.dish_variety.id), name: r.dish_variety.name }
      : undefined,
    genre: r.dish_variety?.dish_genre
      ? { id: String(r.dish_variety.dish_genre.id), name: r.dish_variety.dish_genre.name }
      : undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeGenre(g: any): Genre {
  return {
    id: String(g.id),
    name: g.name ?? '',
    imageUrl: g.image_url ?? undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeVariety(v: any): DishVariety {
  return {
    id: String(v.id),
    name: v.name ?? '',
    genreId: String(v.genre_id),
    genre: v.dish_genre
      ? { id: String(v.dish_genre.id), name: v.dish_genre.name }
      : undefined,
    region: v.region ?? undefined,
    recipeCount: v.recipe_count ?? undefined,
    imageUrl: v.image_url ?? undefined,
  }
}

// ── Service ──────────────────────────────────────────────────────────────────

export const discoveryService = {
  getRecipes: async (params?: DiscoveryParams): Promise<RecipeSummary[]> => {
    const res = await httpClient.get('/discovery/recipes', { params })
    const payload = res.data?.data
    const raw: unknown[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.recipes)
        ? payload.recipes
        : []
    return raw.map(normalizeRecipe)
  },

  getGenres: async (): Promise<Genre[]> => {
    const res = await httpClient.get('/dish-genres')
    const raw: unknown[] = Array.isArray(res.data?.data) ? res.data.data : []
    return raw.map(normalizeGenre)
  },

  /** Backend supports ?genreId=<number> only. Text search is done client-side. */
  getVarieties: async (params?: { genreId?: string }): Promise<DishVariety[]> => {
    const query = params?.genreId ? { genreId: params.genreId } : undefined
    const res = await httpClient.get('/dish-varieties', { params: query })
    const raw: unknown[] = Array.isArray(res.data?.data) ? res.data.data : []
    return raw.map(normalizeVariety)
  },

  /** GET /dish-varieties/:id — variety detail with its published recipes. */
  getVarietyById: async (id: string): Promise<DishVarietyDetail> => {
    const res = await httpClient.get(`/dish-varieties/${id}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d: any = res.data?.data
    return {
      id: String(d.id),
      name: d.name ?? '',
      description: d.description ?? null,
      genreId: String(d.genre_id),
      genre: d.dish_genre
        ? { id: String(d.dish_genre.id), name: d.dish_genre.name }
        : null,
      recipes: (d.recipes ?? []).map((r: any) => ({
        id: String(r.id),
        title: r.title ?? '',
        type: r.type === 'cultural' ? 'cultural' : 'community',
        averageRating: r.average_rating ?? null,
        ratingCount: r.rating_count ?? 0,
        region: r.region ?? null,
        createdAt: r.created_at ?? '',
      })),
    }
  },

  /** GET /meta/regions — hardcoded region list from backend. */
  getRegions: async (): Promise<string[]> => {
    try {
      const res = await httpClient.get('/meta/regions')
      const raw = res.data?.data
      return Array.isArray(raw) ? raw : []
    } catch {
      return []
    }
  },
}

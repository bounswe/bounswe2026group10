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
  country?: string
  city?: string
  averageRating?: number
  ratingCount?: number
  createdAt?: string
  imageUrl?: string
  author: { username: string; role?: string }
  variety?: { id: string; name: string }
  genre?: { id: string; name: string }
}

export interface LocationOptions {
  countries: string[]
  citiesByCountry: Record<string, string[]>
}

export interface DiscoveryParams {
  region?: string
  excludeAllergens?: string
  tagIds?: string
  genreId?: string
  varietyId?: number
  /** Case-insensitive partial match on recipe title (GET /discovery/recipes) */
  search?: string
  country?: string
  city?: string
  page?: number
  limit?: number
}

export interface DietaryTag {
  id: string
  name: string
  category: 'dietary' | 'allergen'
}

export interface DiscoveryPagination {
  page: number
  limit: number
  total: number
}

export interface DiscoveryRecipeResults {
  recipes: RecipeSummary[]
  pagination: DiscoveryPagination
}

// ── Normalizers: map backend snake_case → our camelCase types ────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRecipe(r: any): RecipeSummary {
  return {
    id: String(r.id),
    title: r.title ?? '',
    recipeType: r.type === 'cultural' ? 'cultural' : 'community',
    region: r.dish_variety?.region ?? undefined,
    country: r.country ?? undefined,
    city: r.city ?? undefined,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTag(tag: any): DietaryTag {
  return {
    id: String(tag.id),
    name: tag.name ?? '',
    category: tag.category === 'allergen' ? 'allergen' : 'dietary',
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

  getDietaryTags: async (): Promise<DietaryTag[]> => {
    const res = await httpClient.get('/dietary-tags')
    const raw: unknown[] = Array.isArray(res.data?.data) ? res.data.data : []
    return raw.map(normalizeTag)
  },

  getRecipeResults: async (params?: DiscoveryParams): Promise<DiscoveryRecipeResults> => {
    const res = await httpClient.get('/discovery/recipes', { params })
    const payload = res.data?.data
    const rawRecipes: unknown[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.recipes)
        ? payload.recipes
        : []
    const pagination = payload?.pagination ?? {}

    return {
      recipes: rawRecipes.map(normalizeRecipe),
      pagination: {
        page: Number(pagination.page ?? params?.page ?? 1),
        limit: Number(pagination.limit ?? params?.limit ?? 20),
        total: Number(pagination.total ?? rawRecipes.length),
      },
    }
  },

  getVarieties: async (params?: { genreId?: string; search?: string }): Promise<DishVariety[]> => {
    const query: Record<string, string> = {}
    if (params?.genreId) query.genreId = params.genreId
    if (params?.search?.trim()) query.search = params.search.trim()
    const res = await httpClient.get('/dish-varieties', {
      params: Object.keys(query).length ? query : undefined,
    })
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

  /**
   * Fetch unique country/city values across all recipes for use in filter dropdowns.
   * Calls /discovery/recipes with a high limit and no filters.
   */
  getLocations: async (): Promise<LocationOptions> => {
    try {
      const res = await httpClient.get('/discovery/recipes', { params: { limit: 100, page: 1 } })
      const payload = res.data?.data
      const raw: any[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.recipes)
          ? payload.recipes
          : []

      const citiesByCountry: Record<string, Set<string>> = {}
      for (const r of raw) {
        const country: string | undefined = r.country ?? undefined
        const city: string | undefined = r.city ?? undefined
        if (country) {
          if (!citiesByCountry[country]) citiesByCountry[country] = new Set()
          if (city) citiesByCountry[country].add(city)
        }
      }

      const countries = Object.keys(citiesByCountry).sort()
      const result: Record<string, string[]> = {}
      for (const c of countries) {
        result[c] = [...citiesByCountry[c]].sort()
      }
      return { countries, citiesByCountry: result }
    } catch {
      return { countries: [], citiesByCountry: {} }
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

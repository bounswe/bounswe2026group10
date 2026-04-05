import { fetchApi } from './client';
import type { DishGenre } from './dish-genres';

export type { DishGenre } from './dish-genres';

export type SortOption = 'rating' | 'recent';

export interface Recipe {
  id: string;
  title: string;
  creatorUsername: string;
  averageRating: number;
  ratingCount: number;
  dishVarietyId: number;
  varietyName: string;
  recipeType: 'cultural' | 'community';
  imageUrl: string | null;
}

export interface DietaryTag {
  id: number;
  name: string;
  category: 'dietary' | 'allergen';
}

export interface DishVarietyResult {
  id: number;
  name: string;
  description: string | null;
  genreId: number;
  genreName: string | null;
}

/**
 * Search dish varieties by name.
 * Uses GET /dish-varieties?search=query&genreId=X
 * Falls back to mock data if the backend is unreachable.
 */
export async function searchDishVarieties(
  query: string,
  genreId?: number
): Promise<DishVarietyResult[]> {
  try {
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    if (genreId !== undefined) params.set('genreId', String(genreId));

    const raw = await fetchApi<any[]>(`/dish-varieties?${params.toString()}`);
    return raw.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? null,
      genreId: r.genre_id ?? r.genreId,
      genreName: r.dish_genre?.name ?? null,
    }));
  } catch (error) {
    console.error('searchDishVarieties error:', error);
    return [];
  }
}

/**
 * Fetch all genres, optionally filtered by name query (client-side).
 * Falls back to mock data if the backend is unreachable.
 */
export async function fetchSearchGenres(query?: string): Promise<DishGenre[]> {
  try {
    const genres = await fetchApi<DishGenre[]>('/dish-genres');
    if (!query?.trim()) return genres;
    return genres.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()));
  } catch (error) {
    console.error('fetchSearchGenres error:', error);
    return [];
  }
}

/**
 * Fetch dietary and allergen tags for filter UI.
 * Uses GET /dietary-tags
 */
export async function fetchDietaryTags(): Promise<DietaryTag[]> {
  try {
    const tags = await fetchApi<any[]>('/dietary-tags');
    return tags.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
    }));
  } catch (error) {
    console.error('fetchDietaryTags error:', error);
    return [];
  }
}

/**
 * Search recipes with filters (region, allergens, dietary tags).
 * Two-step process:
 * 1. If query provided, resolve it to varietyId via searchDishVarieties
 * 2. Call GET /discovery/recipes with varietyId + filters
 */
export async function searchRecipesWithFilters(
  query: string,
  filters: {
    excludeAllergenIds?: number[];
    dietaryTagIds?: number[];
    genreId?: number;
  }
): Promise<Recipe[]> {
  try {
    let varietyId: number | undefined;

    // Step 1: Resolve query to varietyId if provided
    if (query.trim()) {
      const varieties = await searchDishVarieties(query);
      varietyId = varieties[0]?.id;
    }

    // Step 2: Call discovery/recipes with filters
    const params = new URLSearchParams();
    if (varietyId !== undefined) params.set('varietyId', String(varietyId));
    if (filters.genreId !== undefined) params.set('genreId', String(filters.genreId));
    if (filters.excludeAllergenIds?.length) {
      params.set('excludeAllergens', filters.excludeAllergenIds.join(','));
    }
    if (filters.dietaryTagIds?.length) {
      params.set('tagIds', filters.dietaryTagIds.join(','));
    }

    const raw = await fetchApi<{ recipes: any[] }>(
      `/discovery/recipes?${params.toString()}`
    );
    return raw.recipes.map((r) => ({
      id: r.id,
      title: r.title,
      creatorUsername: r.profile?.username ?? 'Unknown',
      averageRating: r.average_rating ?? 0,
      ratingCount: r.rating_count ?? 0,
      // dish_variety_id is NOT a flat field in the select — it lives in dish_variety.id
      dishVarietyId: r.dish_variety?.id ?? r.dish_variety_id ?? 0,
      varietyName: r.dish_variety?.name ?? 'Unknown Variety',
      recipeType: (r.type ?? r.recipe_type ?? 'community') as 'cultural' | 'community',
      imageUrl: r.image_url ?? null,
    }));
  } catch (error) {
    console.error('searchRecipesWithFilters error:', error);
    return [];
  }
}

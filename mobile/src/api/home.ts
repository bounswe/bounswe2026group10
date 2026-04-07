import { fetchApi } from './client';
import type { DishGenre } from './dish-genres';

export { type DishGenre } from './dish-genres';

export interface RecipeListItem {
  id: string;
  title: string;
  type: 'community' | 'cultural';
  averageRating: number | null;
  ratingCount: number;
  creatorId: string | null;
  creatorUsername: string | null;
  dishVarietyId: number | null;
  dishVarietyName: string | null;
  genreName: string | null;
  createdAt: string;
  updatedAt: string;
  imageUrl: string | null;
}

export interface RecipeListResponse {
  recipes: RecipeListItem[];
  pagination: { page: number; limit: number; total: number };
}

/**
 * Fetch published recipes sorted by rating (best first).
 * Uses GET /recipes which already sorts by average_rating desc.
 */
export async function fetchCommunityPicks(
  page = 1,
  limit = 10
): Promise<RecipeListResponse> {
  try {
    const raw = await fetchApi<{ recipes: any[]; pagination: any }>(`/recipes?page=${page}&limit=${limit}`);
    const recipes: RecipeListItem[] = (raw.recipes ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      averageRating: r.averageRating ?? null,
      ratingCount: r.ratingCount ?? 0,
      creatorId: r.creatorId ?? null,
      creatorUsername: r.creatorUsername ?? null,
      dishVarietyId: r.dishVarietyId ?? null,
      dishVarietyName: r.dishVarietyName ?? null,
      genreName: r.genreName ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      imageUrl: r.coverImageUrl ?? null,
    }));
    return { recipes, pagination: raw.pagination };
  } catch (error) {
    console.error('fetchCommunityPicks error:', error);
    return {
      recipes: [],
      pagination: { page, limit, total: 0 },
    };
  }
}

/**
 * Fetch dish genres from the backend.
 */
export async function fetchGenres(): Promise<DishGenre[]> {
  try {
    return await fetchApi<DishGenre[]>('/dish-genres');
  } catch (error) {
    console.error('fetchGenres error:', error);
    return [];
  }
}

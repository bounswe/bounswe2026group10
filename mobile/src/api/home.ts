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
    return await fetchApi<RecipeListResponse>(`/recipes?page=${page}&limit=${limit}`);
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

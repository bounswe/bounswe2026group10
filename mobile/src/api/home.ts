import { fetchApi, mockDelay } from './client';
import type { DishGenre } from './dish-genres';
import { mockCommunityPicks, mockGenres } from '../data/mockHome';

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
 * Falls back to mock data if the backend is unreachable.
 */
export async function fetchCommunityPicks(
  page = 1,
  limit = 10
): Promise<RecipeListResponse> {
  try {
    return await fetchApi<RecipeListResponse>(`/recipes?page=${page}&limit=${limit}`);
  } catch {
    await mockDelay();
    return {
      recipes: mockCommunityPicks,
      pagination: { page, limit, total: mockCommunityPicks.length },
    };
  }
}

/**
 * Fetch dish genres from the backend.
 * Falls back to mock data if the backend is unreachable.
 */
export async function fetchGenres(): Promise<DishGenre[]> {
  try {
    return await fetchApi<DishGenre[]>('/dish-genres');
  } catch {
    await mockDelay();
    return mockGenres;
  }
}

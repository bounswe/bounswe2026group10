import { fetchApi } from './client';

export interface IngredientItem {
  id: number;
  name: string;
  allergens: string[];
}

export async function searchIngredients(query: string): Promise<IngredientItem[]> {
  const search = query.trim();
  const path = search.length > 0
    ? `/ingredients?search=${encodeURIComponent(search)}`
    : '/ingredients';
  return fetchApi<IngredientItem[]>(path);
}

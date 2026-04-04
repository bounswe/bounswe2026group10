import { fetchApi } from './client';

export interface IngredientItem {
  id: number;
  name: string;
  allergens: string[];
}

export interface SubstituteItem {
  ingredient: { id: number; name: string };
  amount: number;
  unit: string;
  confidence: number;
  description: string;
}

export async function searchIngredients(query: string): Promise<IngredientItem[]> {
  const search = query.trim();
  const path = search.length > 0
    ? `/ingredients?search=${encodeURIComponent(search)}`
    : '/ingredients';
  return fetchApi<IngredientItem[]>(path);
}

export async function getSubstitutions(
  ingredientId: number,
  amount?: number,
  unit?: string,
): Promise<SubstituteItem[]> {
  let path = `/ingredients/${ingredientId}/substitutions`;
  if (amount !== undefined && unit) {
    path += `?amount=${amount}&unit=${encodeURIComponent(unit)}`;
  }
  return fetchApi<SubstituteItem[]>(path);
}

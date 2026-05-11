import { fetchApi } from './client';

export interface AllergenItem {
  id: number;
  name: string;
}

export async function getAllergens(): Promise<AllergenItem[]> {
  return fetchApi<AllergenItem[]>('/allergens');
}

export async function detectAllergens(ingredientIds: number[]): Promise<AllergenItem[]> {
  return fetchApi<AllergenItem[]>('/allergens/detect', {
    method: 'POST',
    body: JSON.stringify({ ingredientIds }),
  });
}

import { fetchApi } from './client';

export interface AllergenItem {
  id: number;
  name: string;
}

export async function getAllergens(): Promise<AllergenItem[]> {
  try {
    return await fetchApi<AllergenItem[]>('/allergens');
  } catch (error) {
    console.error('getAllergens error:', error);
    return [];
  }
}

export async function detectAllergens(ingredientIds: number[]): Promise<AllergenItem[]> {
  return fetchApi<AllergenItem[]>('/allergens/detect', {
    method: 'POST',
    body: JSON.stringify({ ingredientIds }),
  });
}

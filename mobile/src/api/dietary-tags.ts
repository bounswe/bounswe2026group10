import { fetchApi } from './client';

export interface DietaryTagItem {
  id: number;
  name: string;
  category: 'dietary' | 'allergen';
}

export async function getDietaryTags(): Promise<DietaryTagItem[]> {
  return fetchApi<DietaryTagItem[]>('/dietary-tags');
}

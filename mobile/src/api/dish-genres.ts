import { fetchApi } from './client';

export interface DishVariety {
  id: number;
  name: string;
}

export interface DishGenre {
  id: number;
  name: string;
  description: string | null;
  varieties: DishVariety[];
}

export async function getDishGenres(): Promise<DishGenre[]> {
  return fetchApi<DishGenre[]>('/dish-genres');
}

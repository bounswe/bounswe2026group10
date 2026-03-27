import type { Origin } from './common';
import type { Recipe } from './recipe';

export interface DishGenre {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface DishVariety {
  id: string;
  name: string;
  description: string;
  origin: Origin;
  genreId: string;
}

export type Dish = DishGenre | DishVariety | Recipe;

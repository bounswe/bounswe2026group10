import type { ISODateString, DietaryTag, AllergenTag, RecipeType, Origin } from './common';
import type { User } from './user';
import type { Ingredient, Tool } from './ingredient';
import type { Step } from './step';

export type RecipeStatus = 'PUBLISHED' | 'DRAFT';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  story: string;
  type: RecipeType;
  author: User;
  images: string[];
  videoUrl?: string;
  rating: number;
  ratingCount: number;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: Ingredient[];
  tools: Tool[];
  steps: Step[];
  origin: Origin;
  dishVarietyId: string;
  dishVarietyName: string;
  tags: string[];
  allergens: string[];
  status: RecipeStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  creatorUsername: string;
}

export interface RecipeCard {
  id: string;
  title: string;
  thumbnailUrl: string;
  author: Pick<User, 'id' | 'firstName' | 'lastName'>;
  rating: number;
  ratingCount: number;
  region: string;
  dishVarietyId: string;
  dishVarietyName: string;
  type: RecipeType;
  tags: DietaryTag[];
  status: RecipeStatus;
  updatedAt: ISODateString;
}

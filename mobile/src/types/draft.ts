import type { ISODateString, DietaryTag, AllergenTag, RecipeType } from './common';
import type { Ingredient, Tool } from './ingredient';
import type { Step } from './step';

export interface RecipeDraft {
  localId: string;
  serverId?: string;
  title?: string;
  type?: RecipeType;
  originCountry?: string;
  originCity?: string;
  originDistrict?: string;
  genreId?: string;
  description?: string;
  story?: string;
  tags: DietaryTag[];
  allergens: AllergenTag[];
  images: string[];
  videoUrl?: string;
  servings?: number;
  prepTime?: string;
  cookTime?: string;
  ingredients: Ingredient[];
  tools: Tool[];
  steps: Step[];
  dishVarietyId?: string;
  currentStep: 1 | 2 | 3 | 4;
  lastSavedAt?: ISODateString;
}

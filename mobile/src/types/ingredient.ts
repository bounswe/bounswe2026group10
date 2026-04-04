import type { AllergenTag, MeasurementUnit } from './common';

export interface Ingredient {
  id: string;
  ingredientId: number | null;
  name: string;
  quantity: number;
  unit: MeasurementUnit;
  allergens: AllergenTag[];
  substitutionAvailable: boolean;
}

export interface Tool {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

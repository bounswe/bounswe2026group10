import type { AllergenTag, MeasurementUnit } from './common';

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: MeasurementUnit;
  allergens: AllergenTag[];
  substitutionAvailable: boolean;
  substitutes: string[];
}

export interface Tool {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

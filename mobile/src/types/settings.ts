import type { AllergenTag, DietaryTag } from './common';

export type UnitSystem = 'METRIC' | 'IMPERIAL';

export interface UserSettings {
  userId: string;
  unitSystem: UnitSystem;
  language: string;
  region: string;
  allergenProfile: AllergenTag[];
  dietaryPreferences: DietaryTag[];
  email: string;
}

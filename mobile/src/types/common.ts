export type ISODateString = string;

export type UserRole = 'LEARNER' | 'COOK' | 'EXPERT';

export type RecipeType = 'COMMUNITY' | 'CULTURAL';

export type DietaryTag =
  | 'VEGAN'
  | 'VEGETARIAN'
  | 'HALAL'
  | 'KOSHER'
  | 'GLUTEN_FREE'
  | 'HEARTY';

export type AllergenTag =
  | 'PEANUTS'
  | 'DAIRY'
  | 'SHELLFISH'
  | 'GLUTEN'
  | 'TREE_NUTS';

export type MeasurementUnit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'L'
  | 'cup'
  | 'tbsp'
  | 'tsp'
  | 'piece'
  | 'pinch'
  | 'oz'
  | 'lb';

export type SortOption = 'BEST_RATING' | 'MOST_RECENT' | 'BY_REGION';

export interface Origin {
  country: string;
  city?: string;
  district?: string;
}

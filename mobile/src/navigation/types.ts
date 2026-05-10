export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type RootTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  CreateTab: undefined;
  LibraryTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  RecipeDetail: { recipeId: string };
  CommentsRatings: { recipeId: string; recipeTitle: string; rating: number; ratingCount: number; creatorUsername?: string };
};

export interface ActiveFilters {
  excludeAllergenIds: number[];
  excludeAllergenNames: string[];
  dietaryTagIds: number[];
  dietaryTagNames: string[];
  culturalTagIds: number[];
  culturalTagNames: string[];
  country: string;
  city: string;
}

export type SearchStackParamList = {
  Search: { initialQuery?: string } | undefined;
  DishVarietyDetail: { id: number; filters?: ActiveFilters };
  RecipeDetail: { recipeId: string };
};

export type CreateStackParamList = {
  CreateBasicInfo: undefined;
  CreateIngredientsTools: undefined;
  CreateSteps: undefined;
  CreateReview: undefined;
};

export type LibraryStackParamList = {
  MyLibrary: undefined;
  RecipeDetail: { recipeId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  RecipeDetail: { recipeId: string };
};

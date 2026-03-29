import type { Recipe, RecipeCard } from '../types/recipe';

export type RootTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  CreateTab: undefined;
  LibraryTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  RecipeDetail: { recipe: Recipe; alternatives: RecipeCard[] };
};

export type SearchStackParamList = {
  Search: undefined;
};

export type CreateStackParamList = {
  CreateBasicInfo: undefined;
  CreateIngredientsTools: undefined;
  CreateSteps: undefined;
};

export type LibraryStackParamList = {
  MyLibrary: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
};

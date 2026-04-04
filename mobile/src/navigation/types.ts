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
};

export type SearchStackParamList = {
  Search: undefined;
};

export type CreateStackParamList = {
  CreateBasicInfo: undefined;
  CreateIngredientsTools: undefined;
  CreateSteps: undefined;
  CreateReview: undefined;
};

export type LibraryStackParamList = {
  MyLibrary: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
};

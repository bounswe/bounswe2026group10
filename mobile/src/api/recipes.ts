import { fetchApi } from './client';

export interface CreateRecipeStep {
  stepOrder: number;
  description: string;
}

export interface CreateRecipeIngredient {
  ingredientId: number;
  quantity: number;
  unit: string;
}

export interface CreateRecipeTool {
  name: string;
}

export interface CreateRecipeParams {
  title: string;
  type: 'community' | 'cultural';
  dishVarietyId?: number;
  story?: string;
  videoUrl?: string;
  servingSize?: number;
  isPublished?: boolean;
  ingredients: CreateRecipeIngredient[];
  steps: CreateRecipeStep[];
  tools: CreateRecipeTool[];
  tagIds?: number[];
}

export interface RecipeResponse {
  id: string;
  creatorId: string;
  dishVarietyId: number | null;
  title: string;
  story: string | null;
  videoUrl: string | null;
  servingSize: number | null;
  type: 'community' | 'cultural';
  isPublished: boolean;
  ingredients: CreateRecipeIngredient[];
  steps: CreateRecipeStep[];
  tools: CreateRecipeTool[];
  createdAt: string;
}

export type UpdateRecipeParams = Partial<CreateRecipeParams>;

export async function createRecipe(params: CreateRecipeParams): Promise<RecipeResponse> {
  return fetchApi<RecipeResponse>('/recipes', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function updateRecipe(
  id: string,
  params: UpdateRecipeParams
): Promise<{ message: string; id: string }> {
  return fetchApi<{ message: string; id: string }>(`/recipes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(params),
  });
}

export async function publishRecipe(id: string): Promise<{ id: string; isPublished: boolean }> {
  return fetchApi<{ id: string; isPublished: boolean }>(`/recipes/${id}/publish`, {
    method: 'POST',
  });
}

interface BackendIngredient {
  id: string;
  ingredientId: number | null;
  ingredientName: string | null;
  quantity: number;
  unit: string;
  allergens: string[];
}

interface BackendStep {
  id: string;
  stepOrder: number;
  description: string;
  videoTimestamp: number | null;
}

interface BackendTool {
  id: string;
  name: string;
}

interface BackendMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
}

interface BackendTag {
  id: number | null;
  name: string | null;
  category: 'dietary' | 'allergen';
}

export interface BackendRecipeDetail {
  id: string;
  creatorId: string | null;
  creatorUsername: string | null;
  dishVarietyId: number | null;
  dishVarietyName: string | null;
  genreName: string | null;
  title: string;
  story: string | null;
  videoUrl: string | null;
  servingSize: number | null;
  type: 'community' | 'cultural';
  isPublished: boolean;
  averageRating: number | null;
  ratingCount: number;
  ingredients: BackendIngredient[];
  steps: BackendStep[];
  tools: BackendTool[];
  media: BackendMedia[];
  tags: BackendTag[];
  createdAt: string;
  updatedAt: string;
}

export interface UserRating {
  id: string;
  recipeId: string;
  userId: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export async function getRecipeById(id: string, lang?: string): Promise<BackendRecipeDetail> {
  const query = lang ? `?lang=${lang}` : '';
  return fetchApi<BackendRecipeDetail>(`/recipes/${id}${query}`);
}

export async function rateRecipe(id: string, score: number): Promise<UserRating> {
  return fetchApi<UserRating>(`/recipes/${id}/ratings`, {
    method: 'POST',
    body: JSON.stringify({ score }),
  });
}

export async function getUserRating(id: string): Promise<UserRating | null> {
  return fetchApi<UserRating | null>(`/recipes/${id}/ratings/me`);
}

export async function deleteUserRating(id: string): Promise<void> {
  await fetchApi<null>(`/recipes/${id}/ratings/me`, { method: 'DELETE' });
}

export async function attachRecipeMedia(
  id: string,
  url: string,
  type: 'image' | 'video'
): Promise<void> {
  console.log('[attachRecipeMedia] POST /recipes/' + id + '/media', { url, type });
  try {
    await fetchApi<unknown>(`/recipes/${id}/media`, {
      method: 'POST',
      body: JSON.stringify({ url, type }),
    });
    console.log('[attachRecipeMedia] success for', url);
  } catch (err) {
    console.error('[attachRecipeMedia] FAILED for', url, err);
    throw err;
  }
}

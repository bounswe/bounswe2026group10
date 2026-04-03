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

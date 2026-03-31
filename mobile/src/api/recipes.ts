import type { RecipeType } from '../types/common';
import { mockDelay } from './client';

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
  type: RecipeType;
  dishVarietyId?: number;
  story?: string;
  videoUrl?: string;
  servingSize?: number;
  isPublished?: boolean;
  ingredients: CreateRecipeIngredient[];
  steps: CreateRecipeStep[];
  tools: CreateRecipeTool[];
}

export interface RecipeResponse {
  id: string;
  creatorId: string;
  dishVarietyId: number | null;
  title: string;
  story: string | null;
  videoUrl: string | null;
  servingSize: number | null;
  type: RecipeType;
  isPublished: boolean;
  ingredients: CreateRecipeIngredient[];
  steps: CreateRecipeStep[];
  tools: CreateRecipeTool[];
  createdAt: string;
}

export type UpdateRecipeParams = Partial<CreateRecipeParams>;

export async function createRecipe(params: CreateRecipeParams): Promise<RecipeResponse> {
  await mockDelay();
  return {
    id: 'mock-recipe-001',
    creatorId: 'mock-user-001',
    dishVarietyId: params.dishVarietyId ?? null,
    title: params.title,
    story: params.story ?? null,
    videoUrl: params.videoUrl ?? null,
    servingSize: params.servingSize ?? null,
    type: params.type,
    isPublished: params.isPublished ?? false,
    ingredients: params.ingredients,
    steps: params.steps,
    tools: params.tools,
    createdAt: new Date().toISOString(),
  };
}

export async function updateRecipe(
  id: string,
  params: UpdateRecipeParams
): Promise<{ message: string; id: string }> {
  await mockDelay();
  return { message: 'Recipe updated successfully.', id };
}

export async function publishRecipe(id: string): Promise<{ id: string; isPublished: boolean }> {
  await mockDelay();
  return { id, isPublished: true };
}

import { fetchApi } from './client';

export interface ParsedIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface ParsedStep {
  stepOrder: number;
  description: string;
}

export interface ParsedTool {
  name: string;
}

export interface ParseRecipeResponse {
  title: string;
  ingredients: ParsedIngredient[];
  steps: ParsedStep[];
  tools: ParsedTool[];
}

export async function parseRecipeText(text: string): Promise<ParseRecipeResponse> {
  return fetchApi<ParseRecipeResponse>('/parse/recipe-text', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

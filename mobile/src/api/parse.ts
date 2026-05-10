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

export interface ParseRecipeAudioResponse {
  transcription: {
    text: string;
    languageCode: string;
    languageProbability: number;
    truncated: boolean;
    source: 'audio' | 'video';
  };
  recipe: ParseRecipeResponse;
}

export async function parseRecipeText(text: string): Promise<ParseRecipeResponse> {
  return fetchApi<ParseRecipeResponse>('/parse/recipe-text', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function parseRecipeAudio(
  audioUri: string,
  language: 'en' | 'tr' | 'auto' = 'auto'
): Promise<ParseRecipeAudioResponse> {
  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);
  formData.append('language', language);

  return fetchApi<ParseRecipeAudioResponse>('/parse/recipe-audio', {
    method: 'POST',
    body: formData,
  });
}

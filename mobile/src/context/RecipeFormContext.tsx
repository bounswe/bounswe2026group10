import React, { createContext, useContext, useState } from 'react';
import type { RecipeType } from '../types/common';
import type { Tool } from '../types/ingredient';
import type { IngredientFormItem } from '../components/create-ingredients/IngredientRowEditor';
import type { CulturalTagItem } from '../api/cultural-tags';

export interface ReviewStep {
  description: string;
  timestamp: string; // MM:SS format
}

export interface RecipeFormState {
  // Screen 12 — Basic Info
  title: string;
  type: RecipeType;
  originCountry: string;
  originCity: string;
  originDistrict: string;
  genreId: number | null;     // numeric DB id from GET /dish-genres
  varietyId: number | null;   // numeric DB id (= dishVarietyId) from GET /dish-genres
  dietaryTagIds: number[];    // numeric DB ids from GET /dietary-tags, category=dietary
  dietaryTagNames: string[];  // display names corresponding to dietaryTagIds
  allergenTagIds: number[];   // numeric DB ids from GET /dietary-tags, category=allergen
  allergenTagNames: string[]; // display names corresponding to allergenTagIds
  culturalTagIds: number[];   // numeric DB ids from GET /cultural-tags
  culturalTags: CulturalTagItem[]; // full objects so Review/Detail can render labels without re-fetching
  story: string;
  servingSize: number | undefined;
  // Screen 13 — Ingredients & Tools
  ingredients: IngredientFormItem[];
  tools: Tool[];
  // Screen 12 — recipe images (CDN URLs of successfully uploaded photos)
  imageUrls: string[];
  // Screen 14 — single recipe video (CDN URL post-upload) + steps with timestamps
  videoUrl: string | null;
  videoFileName: string | null;
  steps: ReviewStep[];
}

const EMPTY_DRAFT: RecipeFormState = {
  title: '',
  type: 'COMMUNITY',
  originCountry: '',
  originCity: '',
  originDistrict: '',
  genreId: null,
  varietyId: null,
  dietaryTagIds: [],
  dietaryTagNames: [],
  allergenTagIds: [],
  allergenTagNames: [],
  culturalTagIds: [],
  culturalTags: [],
  story: '',
  servingSize: undefined,
  ingredients: [],
  tools: [],
  imageUrls: [],
  videoUrl: null,
  videoFileName: null,
  steps: [],
};

interface RecipeFormContextValue {
  draft: RecipeFormState;
  updateDraft: (partial: Partial<RecipeFormState>) => void;
  resetDraft: () => void;
}

const RecipeFormContext = createContext<RecipeFormContextValue | null>(null);

export function RecipeFormProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<RecipeFormState>(EMPTY_DRAFT);

  const updateDraft = (partial: Partial<RecipeFormState>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  };

  const resetDraft = () => {
    setDraft(EMPTY_DRAFT);
  };

  return (
    <RecipeFormContext.Provider value={{ draft, updateDraft, resetDraft }}>
      {children}
    </RecipeFormContext.Provider>
  );
}

export function useRecipeForm(): RecipeFormContextValue {
  const ctx = useContext(RecipeFormContext);
  if (!ctx) {
    throw new Error('useRecipeForm must be used inside RecipeFormProvider');
  }
  return ctx;
}

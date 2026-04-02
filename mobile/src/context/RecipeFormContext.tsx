import React, { createContext, useContext, useState } from 'react';
import type { DietaryTag, AllergenTag, RecipeType } from '../types/common';
import type { Tool } from '../types/ingredient';
import type { IngredientFormItem } from '../components/create-ingredients/IngredientRowEditor';

export interface ReviewStep {
  title: string;
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
  genreId: string;
  varietyId: string;
  dietaryTags: DietaryTag[];
  allergenTags: AllergenTag[];
  story: string;
  // Screen 13 — Ingredients & Tools
  ingredients: IngredientFormItem[];
  tools: Tool[];
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
  genreId: '',
  varietyId: '',
  dietaryTags: [],
  allergenTags: [],
  story: '',
  ingredients: [],
  tools: [],
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

import type { RecipeFormState } from '../context/RecipeFormContext';

// ── Basic Info ─────────────────────────────────────────────────────────────────

export function validateBasicInfo(title: string): { title?: string } {
  if (!title.trim()) return { title: 'Recipe title is required' };
  if (title.trim().length < 3) return { title: 'Recipe title must be at least 3 characters' };
  return {};
}

// ── Ingredients ────────────────────────────────────────────────────────────────

export interface IngredientRowError {
  name?: string;
  quantity?: string;
}

export type IngredientErrors = Record<string, IngredientRowError>;

export function validateIngredients(
  ingredients: Array<{ id: string; name: string; quantity: string }>
): IngredientErrors {
  const errors: IngredientErrors = {};
  let hasValidIngredient = false;

  for (const ing of ingredients) {
    const rowError: IngredientRowError = {};
    if (ing.name.trim()) {
      hasValidIngredient = true;
      const qty = parseFloat(ing.quantity);
      if (!ing.quantity.trim() || isNaN(qty) || qty <= 0) {
        rowError.quantity = 'Enter a valid quantity';
      }
    }
    if (Object.keys(rowError).length > 0) {
      errors[ing.id] = rowError;
    }
  }

  if (!hasValidIngredient) {
    const firstId = ingredients[0].id;
    errors[firstId] = { ...errors[firstId], name: 'Add at least one ingredient' };
  }

  return errors;
}

// ── Steps ──────────────────────────────────────────────────────────────────────

export interface StepError {
  title?: string;
  timestamp?: string;
}

export interface StepsValidationResult {
  videoError?: string;
  stepErrors: Record<string, StepError>;
}

export function validateSteps(
  uploading: boolean,
  uploadedUrl: string | null,
  steps: Array<{ id: string; title: string; timestamp: string }>
): StepsValidationResult {
  let videoError: string | undefined;

  if (uploading) {
    videoError = 'Please wait for the video to finish uploading';
  } else if (!uploadedUrl) {
    videoError = 'A recipe video is required';
  }

  const stepErrors: Record<string, StepError> = {};
  for (const step of steps) {
    const rowError: StepError = {};
    if (!step.title.trim()) {
      rowError.title = 'Title is required';
    }
    if (step.timestamp.trim() && !/^\d{1,2}:\d{2}$/.test(step.timestamp.trim())) {
      rowError.timestamp = 'Use MM:SS format (e.g. 01:30)';
    }
    if (Object.keys(rowError).length > 0) {
      stepErrors[step.id] = rowError;
    }
  }

  return { videoError, stepErrors };
}

// ── Review (pre-publish) ───────────────────────────────────────────────────────

export function validateForPublish(draft: RecipeFormState): string[] {
  const missing: string[] = [];
  if (!draft.varietyId)
    missing.push('Dish variety — go back to Basic Info and select a Genre + Variety');
  if (!draft.servingSize)
    missing.push('Serving size — go back to Basic Info');
  const validIngredients = draft.ingredients.filter(
    (i) => i.ingredientId !== null && i.name.trim()
  );
  if (validIngredients.length === 0)
    missing.push('At least 1 ingredient — go back to Ingredients & Tools');
  if (draft.steps.length === 0)
    missing.push('At least 1 step — go back to Steps');
  return missing;
}

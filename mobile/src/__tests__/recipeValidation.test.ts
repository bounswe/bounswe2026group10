import {
  validateBasicInfo,
  validateIngredients,
  validateSteps,
  validateForPublish,
} from '../utils/recipeValidation';
import type { RecipeFormState } from '../context/RecipeFormContext';

// ── validateBasicInfo ──────────────────────────────────────────────────────────

describe('validateBasicInfo', () => {
  it('returns title error when title is empty string', () => {
    expect(validateBasicInfo('')).toEqual({ title: 'Recipe title is required' });
  });

  it('returns title error when title is only whitespace', () => {
    expect(validateBasicInfo('   ')).toEqual({ title: 'Recipe title is required' });
  });

  it('returns length error when title is 2 characters', () => {
    expect(validateBasicInfo('ab')).toEqual({
      title: 'Recipe title must be at least 3 characters',
    });
  });

  it('returns no errors when title is exactly 3 characters', () => {
    expect(validateBasicInfo('abc')).toEqual({});
  });

  it('returns no errors for a normal title', () => {
    expect(validateBasicInfo("Grandma's Soup")).toEqual({});
  });
});

// ── validateIngredients ────────────────────────────────────────────────────────

describe('validateIngredients', () => {
  it('adds name error on first row when no ingredient has a name', () => {
    const errors = validateIngredients([{ id: '1', name: '', quantity: '' }]);
    expect(errors['1'].name).toBe('Add at least one ingredient');
  });

  it('adds quantity error when ingredient has name but empty quantity', () => {
    const errors = validateIngredients([{ id: '1', name: 'Salt', quantity: '' }]);
    expect(errors['1'].quantity).toBe('Enter a valid quantity');
  });

  it('adds quantity error when quantity is zero', () => {
    const errors = validateIngredients([{ id: '1', name: 'Salt', quantity: '0' }]);
    expect(errors['1'].quantity).toBe('Enter a valid quantity');
  });

  it('adds quantity error when quantity is negative', () => {
    const errors = validateIngredients([{ id: '1', name: 'Salt', quantity: '-5' }]);
    expect(errors['1'].quantity).toBe('Enter a valid quantity');
  });

  it('adds quantity error when quantity is non-numeric', () => {
    const errors = validateIngredients([{ id: '1', name: 'Salt', quantity: 'abc' }]);
    expect(errors['1'].quantity).toBe('Enter a valid quantity');
  });

  it('returns no errors for a valid ingredient', () => {
    const errors = validateIngredients([{ id: '1', name: 'Salt', quantity: '5' }]);
    expect(errors).toEqual({});
  });

  it('only flags the invalid row when multiple rows are present', () => {
    const errors = validateIngredients([
      { id: '1', name: 'Salt', quantity: '5' },
      { id: '2', name: 'Pepper', quantity: 'bad' },
    ]);
    expect(errors['1']).toBeUndefined();
    expect(errors['2'].quantity).toBe('Enter a valid quantity');
  });

  it('rows with empty name are ignored (no quantity check)', () => {
    const errors = validateIngredients([
      { id: '1', name: 'Salt', quantity: '5' },
      { id: '2', name: '', quantity: '' },
    ]);
    expect(errors['2']).toBeUndefined();
  });
});

// ── validateSteps ──────────────────────────────────────────────────────────────

describe('validateSteps', () => {
  const noSteps: Array<{ id: string; title: string; timestamp: string }> = [];
  const validStep = { id: 's1', title: 'Boil water', timestamp: '' };

  it('returns videoError when uploading is true', () => {
    const result = validateSteps(true, null, [validStep]);
    expect(result.videoError).toBe('Please wait for the video to finish uploading');
  });

  it('returns videoError when uploadedUrl is null and not uploading', () => {
    const result = validateSteps(false, null, [validStep]);
    expect(result.videoError).toBe('A recipe video is required');
  });

  it('returns no videoError when uploadedUrl is set', () => {
    const result = validateSteps(false, 'https://cdn.example.com/v.mp4', [validStep]);
    expect(result.videoError).toBeUndefined();
  });

  it('returns title stepError when a step has no title', () => {
    const result = validateSteps(false, 'https://cdn.example.com/v.mp4', [
      { id: 's1', title: '', timestamp: '' },
    ]);
    expect(result.stepErrors['s1'].title).toBe('Title is required');
  });

  it('returns no stepError for a step with a valid title', () => {
    const result = validateSteps(false, 'https://cdn.example.com/v.mp4', [validStep]);
    expect(result.stepErrors).toEqual({});
  });

  it('returns no timestamp error when timestamp is empty', () => {
    const result = validateSteps(false, 'https://cdn.example.com/v.mp4', [
      { id: 's1', title: 'Mix', timestamp: '' },
    ]);
    expect(result.stepErrors['s1']).toBeUndefined();
  });

  it('accepts timestamp in MM:SS format', () => {
    const result = validateSteps(false, 'https://cdn.example.com/v.mp4', [
      { id: 's1', title: 'Mix', timestamp: '01:30' },
    ]);
    expect(result.stepErrors['s1']).toBeUndefined();
  });

  it('accepts timestamp with single-digit minutes', () => {
    const result = validateSteps(false, 'https://cdn.example.com/v.mp4', [
      { id: 's1', title: 'Mix', timestamp: '1:30' },
    ]);
    expect(result.stepErrors['s1']).toBeUndefined();
  });

  it('returns timestamp error for non-MM:SS format', () => {
    const result = validateSteps(false, 'https://cdn.example.com/v.mp4', [
      { id: 's1', title: 'Mix', timestamp: '1234' },
    ]);
    expect(result.stepErrors['s1'].timestamp).toBe('Use MM:SS format (e.g. 01:30)');
  });

  it('returns timestamp error for alphabetic input', () => {
    const result = validateSteps(false, 'https://cdn.example.com/v.mp4', [
      { id: 's1', title: 'Mix', timestamp: 'ab:cd' },
    ]);
    expect(result.stepErrors['s1'].timestamp).toBe('Use MM:SS format (e.g. 01:30)');
  });

  it('can return both videoError and stepErrors simultaneously', () => {
    const result = validateSteps(false, null, [{ id: 's1', title: '', timestamp: '' }]);
    expect(result.videoError).toBeDefined();
    expect(result.stepErrors['s1'].title).toBeDefined();
  });
});

// ── validateForPublish ─────────────────────────────────────────────────────────

function makeDraft(overrides: Partial<RecipeFormState> = {}): RecipeFormState {
  return {
    title: 'Test',
    type: 'COMMUNITY',
    originCountry: '',
    originCity: '',
    originDistrict: '',
    genreId: 1,
    varietyId: 5,
    dietaryTagIds: [],
    dietaryTagNames: [],
    allergenTagIds: [],
    allergenTagNames: [],
    story: '',
    servingSize: 4,
    ingredients: [{ id: '1', ingredientId: 1, name: 'Salt', quantity: '5', unit: 'g' }],
    tools: [],
    imageUrls: [],
    videoUrl: null,
    videoFileName: null,
    steps: [{ title: 'Mix', description: '', timestamp: '' }],
    ...overrides,
  };
}

describe('validateForPublish', () => {
  it('returns empty array when all required fields are present', () => {
    expect(validateForPublish(makeDraft())).toEqual([]);
  });

  it('includes variety message when varietyId is null', () => {
    const missing = validateForPublish(makeDraft({ varietyId: null }));
    expect(missing.some((m) => m.includes('Dish variety'))).toBe(true);
  });

  it('includes serving size message when servingSize is undefined', () => {
    const missing = validateForPublish(makeDraft({ servingSize: undefined }));
    expect(missing.some((m) => m.includes('Serving size'))).toBe(true);
  });

  it('includes ingredient message when no ingredient has a valid ingredientId', () => {
    const missing = validateForPublish(
      makeDraft({ ingredients: [{ id: '1', ingredientId: null, name: 'X', quantity: '1', unit: 'g' }] })
    );
    expect(missing.some((m) => m.includes('ingredient'))).toBe(true);
  });

  it('includes ingredient message when ingredients array is empty', () => {
    const missing = validateForPublish(makeDraft({ ingredients: [] }));
    expect(missing.some((m) => m.includes('ingredient'))).toBe(true);
  });

  it('includes step message when steps array is empty', () => {
    const missing = validateForPublish(makeDraft({ steps: [] }));
    expect(missing.some((m) => m.includes('step'))).toBe(true);
  });

  it('returns all missing messages when everything is absent', () => {
    const missing = validateForPublish(
      makeDraft({ varietyId: null, servingSize: undefined, ingredients: [], steps: [] })
    );
    expect(missing).toHaveLength(4);
  });
});

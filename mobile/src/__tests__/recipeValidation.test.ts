import {
  validateBasicInfo,
  validateIngredients,
  validateSteps,
  validateForPublish,
} from '../utils/recipeValidation';
import type { RecipeFormState } from '../context/RecipeFormContext';

// ── validateBasicInfo ──────────────────────────────────────────────────────────

describe('validateBasicInfo', () => {
  const validArgs = ['Valid Title', 'Turkey', 1, 1, '4'] as const;

  it('returns title error when title is empty string', () => {
    const errors = validateBasicInfo('', validArgs[1], validArgs[2], validArgs[3], validArgs[4]);
    expect(errors.title).toBe('Recipe title is required');
  });

  it('returns title error when title is only whitespace', () => {
    const errors = validateBasicInfo('   ', validArgs[1], validArgs[2], validArgs[3], validArgs[4]);
    expect(errors.title).toBe('Recipe title is required');
  });

  it('returns length error when title is 2 characters', () => {
    const errors = validateBasicInfo('ab', validArgs[1], validArgs[2], validArgs[3], validArgs[4]);
    expect(errors.title).toBe('Recipe title must be at least 3 characters');
  });

  it('returns no errors when title is exactly 3 characters', () => {
    const errors = validateBasicInfo('abc', validArgs[1], validArgs[2], validArgs[3], validArgs[4]);
    expect(errors).toEqual({});
  });

  it('returns no errors for a normal title', () => {
    const errors = validateBasicInfo("Grandma's Soup", validArgs[1], validArgs[2], validArgs[3], validArgs[4]);
    expect(errors).toEqual({});
  });

  it('returns country error when country is empty', () => {
    const errors = validateBasicInfo(validArgs[0], '', validArgs[2], validArgs[3], validArgs[4]);
    expect(errors.country).toBe('Origin country is required');
  });

  it('returns genre error when genreId is null', () => {
    const errors = validateBasicInfo(validArgs[0], validArgs[1], null, validArgs[3], validArgs[4]);
    expect(errors.genre).toBe('Please select a dish genre');
  });

  it('returns variety error when varietyId is null', () => {
    const errors = validateBasicInfo(validArgs[0], validArgs[1], validArgs[2], null, validArgs[4]);
    expect(errors.variety).toBe('Please select a dish variety');
  });

  it('returns servingSize error when servingSize is empty', () => {
    const errors = validateBasicInfo(validArgs[0], validArgs[1], validArgs[2], validArgs[3], '');
    expect(errors.servingSize).toBe('Serving size is required');
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
  const validStep = { id: 's1', description: 'Boil water', timestamp: '' };

  it('returns videoError when uploading is true', () => {
    const result = validateSteps(true, null, [validStep]);
    expect(result.videoError).toBe('Please wait for the video to finish uploading');
  });

  it('returns no videoError when not uploading', () => {
    const result = validateSteps(false, null, [validStep]);
    expect(result.videoError).toBeUndefined();
  });

  it('returns description stepError when a step has no description', () => {
    const result = validateSteps(false, 'https://cdn.example.com/v.mp4', [
      { id: 's1', description: '', timestamp: '' },
    ]);
    expect(result.stepErrors['s1'].description).toBe('Description is required');
  });

  it('returns no stepError for a step with a valid description', () => {
    const result = validateSteps(false, 'https://cdn.example.com/v.mp4', [validStep]);
    expect(result.stepErrors).toEqual({});
  });

  it('returns no timestamp error when timestamp is empty', () => {
    const result = validateSteps(false, 'https://cdn.example.com/v.mp4', [
      { id: 's1', description: 'Mix', timestamp: '' },
    ]);
    expect(result.stepErrors['s1']).toBeUndefined();
  });

  it('accepts timestamp in MM:SS format', () => {
    const result = validateSteps(false, 'https://cdn.example.com/v.mp4', [
      { id: 's1', description: 'Mix', timestamp: '01:30' },
    ]);
    expect(result.stepErrors['s1']).toBeUndefined();
  });

  it('accepts timestamp with single-digit minutes', () => {
    const result = validateSteps(false, 'https://cdn.example.com/v.mp4', [
      { id: 's1', description: 'Mix', timestamp: '1:30' },
    ]);
    expect(result.stepErrors['s1']).toBeUndefined();
  });

  it('returns timestamp error for non-MM:SS format', () => {
    const result = validateSteps(false, 'https://cdn.example.com/v.mp4', [
      { id: 's1', description: 'Mix', timestamp: '1234' },
    ]);
    expect(result.stepErrors['s1'].timestamp).toBe('Use MM:SS format (e.g. 01:30)');
  });

  it('returns timestamp error for alphabetic input', () => {
    const result = validateSteps(false, 'https://cdn.example.com/v.mp4', [
      { id: 's1', description: 'Mix', timestamp: 'ab:cd' },
    ]);
    expect(result.stepErrors['s1'].timestamp).toBe('Use MM:SS format (e.g. 01:30)');
  });

  it('can return both videoError and stepErrors simultaneously', () => {
    const result = validateSteps(true, null, [{ id: 's1', description: '', timestamp: '' }]);
    expect(result.videoError).toBeDefined();
    expect(result.stepErrors['s1'].description).toBeDefined();
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
    steps: [{ description: 'Mix', timestamp: '' }],
    ...overrides,
  };
}

describe('validateForPublish', () => {
  it('returns empty array when all required fields are present', () => {
    expect(validateForPublish(makeDraft())).toEqual([]);
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
      makeDraft({ ingredients: [], steps: [] })
    );
    expect(missing).toHaveLength(2);
  });
});

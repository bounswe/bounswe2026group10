import { buildRecipePayload } from '../utils/buildRecipePayload';
import type { RecipeFormState } from '../context/RecipeFormContext';

function makeDraft(overrides: Partial<RecipeFormState> = {}): RecipeFormState {
  return {
    title: 'Test Recipe',
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
    story: '',
    servingSize: undefined,
    ingredients: [],
    tools: [],
    imageUrls: [],
    videoUrl: null,
    videoFileName: null,
    steps: [],
    ...overrides,
  };
}

describe('buildRecipePayload', () => {
  it('lowercases the recipe type', () => {
    const payload = buildRecipePayload(makeDraft({ type: 'COMMUNITY' }));
    expect(payload.type).toBe('community');
  });

  it('sets story to undefined when draft.story is empty string', () => {
    const payload = buildRecipePayload(makeDraft({ story: '' }));
    expect(payload.story).toBeUndefined();
  });

  it('includes story when it has a value', () => {
    const payload = buildRecipePayload(makeDraft({ story: 'A family recipe.' }));
    expect(payload.story).toBe('A family recipe.');
  });

  it('sets dishVarietyId to undefined when varietyId is null', () => {
    const payload = buildRecipePayload(makeDraft({ varietyId: null }));
    expect(payload.dishVarietyId).toBeUndefined();
  });

  it('passes dishVarietyId through when varietyId is set', () => {
    const payload = buildRecipePayload(makeDraft({ varietyId: 42 }));
    expect(payload.dishVarietyId).toBe(42);
  });

  it('sets videoUrl to undefined when draft.videoUrl is null', () => {
    const payload = buildRecipePayload(makeDraft({ videoUrl: null }));
    expect(payload.videoUrl).toBeUndefined();
  });

  it('includes videoUrl when set', () => {
    const payload = buildRecipePayload(makeDraft({ videoUrl: 'https://cdn.example.com/v.mp4' }));
    expect(payload.videoUrl).toBe('https://cdn.example.com/v.mp4');
  });

  it('filters out ingredients with null ingredientId', () => {
    const payload = buildRecipePayload(
      makeDraft({
        ingredients: [
          { id: '1', ingredientId: null, name: 'Unknown', quantity: '50', unit: 'g' },
          { id: '2', ingredientId: 5, name: 'Salt', quantity: '10', unit: 'g' },
        ],
      })
    );
    expect(payload.ingredients).toHaveLength(1);
    expect(payload.ingredients[0].ingredientId).toBe(5);
  });

  it('filters out ingredients with empty name', () => {
    const payload = buildRecipePayload(
      makeDraft({
        ingredients: [
          { id: '1', ingredientId: 3, name: '   ', quantity: '50', unit: 'g' },
          { id: '2', ingredientId: 4, name: 'Pepper', quantity: '2', unit: 'g' },
        ],
      })
    );
    expect(payload.ingredients).toHaveLength(1);
    expect(payload.ingredients[0].ingredientId).toBe(4);
  });

  it('maps ingredients with parsed float quantity', () => {
    const payload = buildRecipePayload(
      makeDraft({
        ingredients: [{ id: '1', ingredientId: 7, name: 'Flour', quantity: '200.5', unit: 'g' }],
      })
    );
    expect(payload.ingredients[0]).toEqual({ ingredientId: 7, quantity: 200.5, unit: 'g' });
  });

  it('assigns stepOrder starting at 1 and incrementing', () => {
    const payload = buildRecipePayload(
      makeDraft({
        steps: [
          { title: 'Mix', description: 'Mix everything', timestamp: '' },
          { title: 'Bake', description: 'Bake it', timestamp: '' },
        ],
      })
    );
    expect(payload.steps[0].stepOrder).toBe(1);
    expect(payload.steps[1].stepOrder).toBe(2);
  });

  it('falls back to step title when description is empty', () => {
    const payload = buildRecipePayload(
      makeDraft({
        steps: [{ title: 'Preheat oven', description: '', timestamp: '' }],
      })
    );
    expect(payload.steps[0].description).toBe('Preheat oven');
  });

  it('uses description over title when both are present', () => {
    const payload = buildRecipePayload(
      makeDraft({
        steps: [{ title: 'Step 1', description: 'Detailed description', timestamp: '' }],
      })
    );
    expect(payload.steps[0].description).toBe('Detailed description');
  });

  it('combines dietaryTagIds and allergenTagIds into tagIds', () => {
    const payload = buildRecipePayload(
      makeDraft({ dietaryTagIds: [1, 2], allergenTagIds: [10, 11] })
    );
    expect(payload.tagIds).toEqual([1, 2, 10, 11]);
  });

  it('maps tools to { name } only', () => {
    const payload = buildRecipePayload(
      makeDraft({ tools: [{ id: 'pan', name: 'Pan' }, { id: 'knife', name: 'Knife' }] })
    );
    expect(payload.tools).toEqual([{ name: 'Pan' }, { name: 'Knife' }]);
  });
});

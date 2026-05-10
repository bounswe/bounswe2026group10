import { mapBackendRecipeToMobile } from '../api/recipeMapper';
import type { BackendRecipeDetail } from '../api/recipes';

function makeBackendRecipe(
  overrides: Partial<BackendRecipeDetail> = {},
): BackendRecipeDetail {
  return {
    id: 'recipe-1',
    creatorId: 'user-1',
    creatorUsername: 'cook',
    dishVarietyId: 1,
    dishVarietyName: 'Adana',
    genreName: 'Kebabs',
    title: 'Adana Kebap',
    story: null,
    videoUrl: null,
    servingSize: 4,
    type: 'cultural',
    isPublished: true,
    averageRating: 4.5,
    ratingCount: 10,
    ingredients: [],
    steps: [],
    tools: [],
    media: [],
    tags: [],
    country: 'Turkey',
    city: null,
    district: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('mapBackendRecipeToMobile isFavorited', () => {
  it('forwards isFavorited=true when backend says so', () => {
    const result = mapBackendRecipeToMobile(makeBackendRecipe({ isFavorited: true }));
    expect(result.isFavorited).toBe(true);
  });

  it('forwards isFavorited=false when backend says so', () => {
    const result = mapBackendRecipeToMobile(makeBackendRecipe({ isFavorited: false }));
    expect(result.isFavorited).toBe(false);
  });

  it('defaults to false when the backend omits the field (anonymous viewer)', () => {
    const result = mapBackendRecipeToMobile(makeBackendRecipe());
    expect(result.isFavorited).toBe(false);
  });
});

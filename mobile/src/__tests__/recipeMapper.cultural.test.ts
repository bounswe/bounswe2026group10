import { mapBackendRecipeToMobile } from '../api/recipeMapper';
import type { BackendRecipeDetail } from '../api/recipes';
import type { CulturalTagItem } from '../api/cultural-tags';

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

describe('mapBackendRecipeToMobile cultural tags', () => {
  it('passes backend-provided culturalTags through verbatim', () => {
    const provided: CulturalTagItem[] = [
      { id: 99, key: 'iftar', labelEn: 'Iftar', labelTr: 'İftar', country: 'Turkey' },
    ];
    const result = mapBackendRecipeToMobile(
      makeBackendRecipe({ culturalTags: provided }),
    );
    expect(result.culturalTags).toBe(provided);
  });

  it('returns [] when backend payload omits culturalTags', () => {
    const result = mapBackendRecipeToMobile(makeBackendRecipe());
    expect(result.culturalTags).toEqual([]);
  });

  it('returns [] when backend payload sets culturalTags to an empty array', () => {
    const result = mapBackendRecipeToMobile(
      makeBackendRecipe({ culturalTags: [] }),
    );
    expect(result.culturalTags).toEqual([]);
  });
});

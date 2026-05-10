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
  it('uses backend-provided culturalTags verbatim when present', () => {
    const provided: CulturalTagItem[] = [
      { id: 99, key: 'iftar', labelEn: 'Iftar', labelTr: 'İftar', country: 'Turkey' },
    ];
    const result = mapBackendRecipeToMobile(
      makeBackendRecipe({ culturalTags: provided } as Partial<BackendRecipeDetail> & {
        culturalTags: CulturalTagItem[];
      }),
    );
    expect(result.culturalTags).toBe(provided);
  });

  it('falls back to mock tags when backend payload omits culturalTags', () => {
    const result = mapBackendRecipeToMobile(makeBackendRecipe());
    expect(result.culturalTags.length).toBeGreaterThan(0);
    // All fallback tags must be eligible for the recipe's country
    for (const tag of result.culturalTags) {
      expect(tag.country === null || tag.country === 'Turkey').toBe(true);
    }
  });

  it('fallback is deterministic for the same recipe id+country', () => {
    const a = mapBackendRecipeToMobile(makeBackendRecipe());
    const b = mapBackendRecipeToMobile(makeBackendRecipe());
    expect(a.culturalTags.map((t) => t.id)).toEqual(b.culturalTags.map((t) => t.id));
  });

  it('different recipe ids can produce different fallback tag sets', () => {
    const sets = new Set(
      ['r-a', 'r-b', 'r-c', 'r-d', 'r-e'].map((id) =>
        mapBackendRecipeToMobile(makeBackendRecipe({ id }))
          .culturalTags.map((t) => t.id)
          .join(','),
      ),
    );
    expect(sets.size).toBeGreaterThan(1);
  });

  it('respects country scoping in the fallback (Japan recipe never gets Turkey-only tags)', () => {
    const result = mapBackendRecipeToMobile(makeBackendRecipe({ country: 'Japan' }));
    for (const tag of result.culturalTags) {
      expect(tag.country === null || tag.country === 'Japan').toBe(true);
    }
  });
});

import {
  getCulturalTags,
  pickCulturalTagLabel,
  getMockCulturalTagsForRecipe,
} from '../api/cultural-tags';

jest.mock('../api/client', () => ({
  mockDelay: jest.fn().mockResolvedValue(undefined),
}));

describe('getCulturalTags', () => {
  it('returns the full taxonomy when no country is given', async () => {
    const tags = await getCulturalTags();
    expect(tags.length).toBeGreaterThanOrEqual(10);
    expect(tags.find((t) => t.key === 'wedding')).toBeDefined();
    expect(tags.find((t) => t.key === 'mochitsuki')).toBeDefined();
  });

  it('returns global tags plus country-scoped tags when country = Turkey', async () => {
    const tags = await getCulturalTags('Turkey');
    expect(tags.find((t) => t.key === 'sira-gecesi')).toBeDefined();
    expect(tags.find((t) => t.key === 'iftar')).toBeDefined();
    expect(tags.find((t) => t.key === 'mochitsuki')).toBeUndefined();
    // global tags still present
    expect(tags.find((t) => t.key === 'wedding')).toBeDefined();
  });

  it('matches country case-insensitively', async () => {
    const tags = await getCulturalTags('japan');
    expect(tags.find((t) => t.key === 'mochitsuki')).toBeDefined();
    expect(tags.find((t) => t.key === 'sira-gecesi')).toBeUndefined();
  });

  it('treats empty/whitespace country as global-only filter (returns full list)', async () => {
    const tags = await getCulturalTags('');
    expect(tags.length).toBeGreaterThanOrEqual(10);
  });
});

describe('pickCulturalTagLabel', () => {
  const tag = {
    id: 1,
    key: 'wedding',
    labelEn: 'Wedding',
    labelTr: 'Düğün',
    country: null,
  };

  it('returns the English label for en locale', () => {
    expect(pickCulturalTagLabel(tag, 'en')).toBe('Wedding');
  });

  it('returns the Turkish label for tr locale', () => {
    expect(pickCulturalTagLabel(tag, 'tr')).toBe('Düğün');
  });

  it('falls back to English for unknown locales', () => {
    expect(pickCulturalTagLabel(tag, 'de')).toBe('Wedding');
  });
});

describe('getMockCulturalTagsForRecipe', () => {
  it('returns deterministic tags for the same recipe id', () => {
    const a = getMockCulturalTagsForRecipe('recipe-42', null);
    const b = getMockCulturalTagsForRecipe('recipe-42', null);
    expect(a).toEqual(b);
  });

  it('returns different selections for different recipe ids', () => {
    // Across a wide id space, at least one pair should differ. This protects
    // against a regression that would always pick the same tag.
    const samples = ['r-1', 'r-2', 'r-3', 'r-4', 'r-5'].map((id) =>
      getMockCulturalTagsForRecipe(id, null).map((t) => t.id).join(','),
    );
    const unique = new Set(samples);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('returns 1 or 2 tags', () => {
    const tags = getMockCulturalTagsForRecipe('recipe-id', null);
    expect(tags.length).toBeGreaterThanOrEqual(1);
    expect(tags.length).toBeLessThanOrEqual(2);
  });

  it('never returns duplicate tag ids in the result', () => {
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      const tags = getMockCulturalTagsForRecipe(id, null);
      const ids = tags.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('respects country scoping (Japan-only set excludes Turkey-only tags)', () => {
    // Across many ids, every returned tag for country=Japan must be either
    // global (country=null) or Japan-scoped — never a Turkey-only tag.
    for (const id of ['j1', 'j2', 'j3', 'j4', 'j5']) {
      const tags = getMockCulturalTagsForRecipe(id, 'Japan');
      for (const tag of tags) {
        expect(tag.country === null || tag.country === 'Japan').toBe(true);
      }
    }
  });

  it('matches country case-insensitively', () => {
    const upper = getMockCulturalTagsForRecipe('same-id', 'TURKEY');
    const lower = getMockCulturalTagsForRecipe('same-id', 'turkey');
    expect(upper).toEqual(lower);
  });

  it('returns an empty array for an unknown country with no global pool overlap is impossible (sanity check global tags exist)', () => {
    // Even with a country that matches nothing, global tags are still eligible.
    const tags = getMockCulturalTagsForRecipe('id', 'Atlantis');
    expect(tags.length).toBeGreaterThan(0);
    for (const tag of tags) {
      expect(tag.country).toBeNull();
    }
  });
});

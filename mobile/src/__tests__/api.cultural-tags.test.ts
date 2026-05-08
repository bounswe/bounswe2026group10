import { getCulturalTags, pickCulturalTagLabel } from '../api/cultural-tags';

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

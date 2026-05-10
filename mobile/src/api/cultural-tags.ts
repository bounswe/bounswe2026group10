// TODO: replace mock implementation with `fetchApi` once GET /cultural-tags ships.
// The shape below mirrors the planned API: a region-scoped lookup keyed off the
// user's selected country. Tags whose `country` is null are global and are
// always returned.
//
// Once the backend is live, swap the body of `getCulturalTags` for:
//   const qs = country ? `?country=${encodeURIComponent(country)}` : '';
//   try {
//     return await fetchApi<CulturalTagItem[]>(`/cultural-tags${qs}`);
//   } catch (err) {
//     console.error('getCulturalTags error:', err);
//     return [];
//   }

import { mockDelay } from './client';

export interface CulturalTagItem {
  id: number;
  key: string;
  labelEn: string;
  labelTr: string;
  country: string | null;
}

const MOCK_CULTURAL_TAGS: CulturalTagItem[] = [
  { id: 1, key: 'wedding',          labelEn: 'Wedding',             labelTr: 'Düğün',           country: null },
  { id: 2, key: 'funeral',          labelEn: 'Funeral / Mourning',  labelTr: 'Cenaze / Yas',    country: null },
  { id: 3, key: 'birth',            labelEn: 'Birth / Newborn',     labelTr: 'Doğum',           country: null },
  { id: 4, key: 'new-year',         labelEn: 'New Year',            labelTr: 'Yılbaşı',         country: null },
  { id: 5, key: 'harvest',          labelEn: 'Harvest',             labelTr: 'Hasat',           country: null },
  { id: 6, key: 'religious-feast',  labelEn: 'Religious Feast',     labelTr: 'Dini Bayram',     country: null },
  { id: 7, key: 'social-gathering', labelEn: 'Social Gathering',    labelTr: 'Sosyal Toplantı', country: null },
  { id: 8, key: 'sira-gecesi',      labelEn: 'Sıra Gecesi',         labelTr: 'Sıra Gecesi',     country: 'Turkey' },
  { id: 9, key: 'iftar',            labelEn: 'Iftar',               labelTr: 'İftar',           country: 'Turkey' },
  { id: 10, key: 'mochitsuki',      labelEn: 'Mochitsuki',          labelTr: 'Mochitsuki',      country: 'Japan' },
];

export async function getCulturalTags(country?: string | null): Promise<CulturalTagItem[]> {
  await mockDelay(150);
  if (!country) {
    return MOCK_CULTURAL_TAGS;
  }
  const normalized = country.trim().toLowerCase();
  return MOCK_CULTURAL_TAGS.filter(
    (tag) => tag.country === null || tag.country.toLowerCase() === normalized,
  );
}

export function pickCulturalTagLabel(tag: CulturalTagItem, locale: string): string {
  return locale.startsWith('tr') ? tag.labelTr : tag.labelEn;
}

// MOCK FALLBACK — remove once the backend returns `culturalTags` on the
// recipe-detail payload. Picks 2 deterministic tags based on a hash of the
// recipe id, scoped to the recipe's country, so different recipes display
// different tags and the UI is visibly populated.
export function getMockCulturalTagsForRecipe(
  recipeId: string,
  country: string | null,
): CulturalTagItem[] {
  const eligible = country
    ? MOCK_CULTURAL_TAGS.filter(
        (tag) =>
          tag.country === null ||
          tag.country.toLowerCase() === country.trim().toLowerCase(),
      )
    : MOCK_CULTURAL_TAGS;
  if (eligible.length === 0) return [];

  const hash = [...recipeId].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const first = eligible[hash % eligible.length];
  const second = eligible[(hash * 7 + 3) % eligible.length];
  if (!second || second.id === first.id) return [first];
  return [first, second];
}

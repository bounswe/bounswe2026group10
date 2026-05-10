import { fetchApi } from './client';

export interface CulturalTagItem {
  id: number;
  key: string;
  labelEn: string;
  labelTr: string;
  country: string | null;
}

export async function getCulturalTags(country?: string | null): Promise<CulturalTagItem[]> {
  const qs = country ? `?country=${encodeURIComponent(country)}` : '';
  try {
    return await fetchApi<CulturalTagItem[]>(`/cultural-tags${qs}`);
  } catch (err) {
    console.error('getCulturalTags error:', err);
    return [];
  }
}

export function pickCulturalTagLabel(tag: CulturalTagItem, locale: string): string {
  return locale.startsWith('tr') ? tag.labelTr : tag.labelEn;
}

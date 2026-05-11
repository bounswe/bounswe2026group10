import { httpClient } from '@/lib/http-client'

/**
 * Cultural tag — curated taxonomy entry used to label recipes by cultural
 * occasion or event (e.g. "wedding", "iftar", "sıra-gecesi"). Tags with
 * `country = null` are global; others are region-scoped.
 */
export interface CulturalTag {
  id: number
  key: string
  labelEn: string | null
  labelTr: string | null
  country: string | null
}

interface ApiEnvelope<T> {
  success: boolean
  data: T
  error: null
}

interface CulturalTagRow {
  id: number
  key: string
  labelEn: string | null
  labelTr: string | null
  country: string | null
}

export const culturalTagService = {
  /**
   * GET /cultural-tags — list all cultural tags.
   * When `country` is provided, returns global tags plus tags scoped to that country.
   */
  list: async (country?: string): Promise<CulturalTag[]> => {
    const params = country ? { country } : undefined
    const { data } = await httpClient.get<ApiEnvelope<CulturalTagRow[]>>(
      '/cultural-tags',
      { params },
    )
    const raw = Array.isArray(data.data) ? data.data : []
    return raw.map((row) => ({
      id: Number(row.id),
      key: String(row.key ?? ''),
      labelEn: row.labelEn ?? null,
      labelTr: row.labelTr ?? null,
      country: row.country ?? null,
    }))
  },
}

/** Choose the localized label, falling back to the other language or the key. */
export function culturalTagLabel(tag: CulturalTag, lang: 'en' | 'tr'): string {
  if (lang === 'tr') return tag.labelTr ?? tag.labelEn ?? tag.key
  return tag.labelEn ?? tag.labelTr ?? tag.key
}

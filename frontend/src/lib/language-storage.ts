/** Persisted UI locale (separate from profile "preferred language" on register). */
export const LANGUAGE_STORAGE_KEY = 'rr-app-language'

export const SUPPORTED_LANGUAGES = ['en', 'tr'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export function getStoredLanguage(): AppLanguage {
  try {
    const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (raw === 'en' || raw === 'tr') return raw
  } catch {
    /* ignore */
  }
  return 'en'
}

export function persistLanguage(lng: string): void {
  try {
    const short = lng.split('-')[0]
    if (short === 'en' || short === 'tr') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, short)
    }
  } catch {
    /* ignore */
  }
}
